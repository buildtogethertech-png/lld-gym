import { NextRequest, NextResponse } from "next/server";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";
import { generateEvalPrompt } from "@/lib/prompt";
import { PROBLEMS } from "@/lib/problems";
import { FOUNDATION_PROBLEMS } from "@/lib/foundation-problems";
import OpenAI from "openai";
import { AUTO_COMPLETE_MIN_SCORE } from "@/lib/eval-completion";
import {
  formatEvalLimitRefresh,
  resolveEvalLimitTimeZone,
  startOfNextUtcMonth,
  startOfUtcMonth,
} from "@/lib/eval-limits-config";
import { getEffectivePlan } from "@/lib/plan-config";

const ALL_PROBLEMS = [...FOUNDATION_PROBLEMS, ...PROBLEMS];

export interface EvalCategory {
  name: string;
  score: number;
  max: number;
  good: string;
  bad: string;
}

export interface EvalResult {
  total: number;
  categories: EvalCategory[];
  verdict: "poor" | "warning" | "strong" | "excellent";
  improvements: string[];
  rawFeedback: string;
  modelUsed?: string;
}

const SYSTEM_PROMPT = `You are a strict Low-Level Design interviewer.
Evaluate the solution and respond ONLY with valid JSON in exactly this format:
{
  "total": <number 0-100>,
  "categories": [
    {"name": "Entity Modeling", "score": <0-20>, "max": 20, "good": "<what's right>", "bad": "<what's wrong/missing>"},
    {"name": "Relationships", "score": <0-20>, "max": 20, "good": "<what's right>", "bad": "<what's wrong/missing>"},
    {"name": "SOLID Principles", "score": <0-20>, "max": 20, "good": "<what's right>", "bad": "<what's wrong/missing>"},
    {"name": "Design Patterns", "score": <0-20>, "max": 20, "good": "<what's right>", "bad": "<what's wrong/missing>"},
    {"name": "Code Quality", "score": <0-20>, "max": 20, "good": "<what's right>", "bad": "<what's wrong/missing>"}
  ],
  "verdict": "<poor|warning|strong|excellent>",
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
}
Rules: verdict=poor if total<60, warning if 60-84, strong if 85-94, excellent if 95+.
Be brutally honest. No markdown, no extra text — pure JSON only.`;

// Fallback chains per provider — tried in order until one succeeds.
// Gemini: many IDs share capacity; "high demand" often clears on the next model or a backup provider key.
const FALLBACK_MODELS: Record<string, string[]> = {
  gemini: [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite-preview",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-flash-latest",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro-latest",
  ],
  groq: [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "llama3-70b-8192",
    "llama3-8b-8192",
    "mixtral-8x7b-32768",
  ],
  openai: ["gpt-4o-mini", "gpt-3.5-turbo"],
  anthropic: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"],
};

function detectProvider(apiKey: string): "anthropic" | "gemini" | "groq" | "openai" {
  if (apiKey.startsWith("sk-ant-")) return "anthropic";
  if (apiKey.startsWith("AIza"))    return "gemini";
  if (apiKey.startsWith("gsk_"))    return "groq";
  return "openai";
}

function buildModelQueue(provider: string, savedModel: string | undefined): string[] {
  const defaults = FALLBACK_MODELS[provider] ?? [];
  const s = savedModel?.trim();
  if (!s) return defaults;
  // Ignore a saved model from the wrong provider (e.g. gemini id when failing over to Groq).
  if (provider === "gemini" && !/^gemini/i.test(s)) return defaults;
  if (provider === "groq" && /^gemini|^claude|^gpt-/i.test(s)) return defaults;
  if (provider === "openai" && /^gemini|^claude|^llama|^mixtral/i.test(s)) return defaults;
  if (provider === "anthropic" && !/^claude/i.test(s)) return defaults;
  return [s, ...defaults.filter((m) => m !== s)];
}

/** Primary platform key + optional fallback (e.g. Groq when primary is Gemini). */
function platformKeysInOrder(): string[] {
  const primary = process.env.PLATFORM_API_KEY?.trim();
  const fallback = process.env.PLATFORM_FALLBACK_API_KEY?.trim();
  if (!primary) return [];
  if (!fallback || fallback === primary) return [primary];
  return [primary, fallback];
}

async function callGemini(apiKey: string, model: string, systemPrompt: string, userPrompt: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1500 },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const errMsg =
      (typeof err?.error?.message === "string" && err.error.message) ||
      (typeof err?.message === "string" && err.message) ||
      "";
    const overload =
      res.status === 503 ||
      res.status === 429 ||
      err?.error?.code === 429 ||
      /high demand|overloaded|resource exhausted|too many requests|capacity|unavailable|try again later/i.test(
        errMsg
      );
    const msg = errMsg || `Gemini HTTP ${res.status}`;
    throw Object.assign(new Error(msg), { isRateLimit: overload, status: res.status });
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (text.trim()) return text;

  const finish = data.candidates?.[0]?.finishReason;
  const blocked = data.promptFeedback?.blockReason;
  const detail = [finish && `finishReason=${finish}`, blocked && `blockReason=${blocked}`]
    .filter(Boolean)
    .join(" ");
  throw Object.assign(new Error(detail ? `Gemini returned no text (${detail})` : "Gemini returned no text"), {
    isRateLimit: false,
    status: res.status,
  });
}

async function callAnthropic(apiKey: string, model: string, systemPrompt: string, userPrompt: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model, max_tokens: 1500, system: systemPrompt, messages: [{ role: "user", content: userPrompt }] }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const isRateLimit = res.status === 429;
    throw Object.assign(new Error(err?.error?.message ?? "Anthropic error"), { isRateLimit, status: res.status });
  }
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

async function callOpenAICompat(apiKey: string, model: string, systemPrompt: string, userPrompt: string, baseURL?: string) {
  const openai = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
  try {
    const completion = await openai.chat.completions.create({
      model, max_tokens: 1500, temperature: 0.2,
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
    });
    return completion.choices[0]?.message?.content ?? "";
  } catch (e: unknown) {
    const status = (e as { status?: number })?.status;
    const isRateLimit = status === 429;
    throw Object.assign(e instanceof Error ? e : new Error(String(e)), { isRateLimit, status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const uid = await getUid();
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { problemId, answer, language = "java", timeZone: clientTimeZone } = await req.json();
    if (!problemId || answer === undefined) {
      return NextResponse.json({ error: "problemId and answer required" }, { status: 400 });
    }
    const limitDisplayTz = resolveEvalLimitTimeZone(clientTimeZone);

    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { apiKey: true, aiModel: true, isPaid: true, planExpiry: true, planId: true },
    });

    // JWT can outlive the DB row (deleted user, wrong id on token, env switch). Never upsert submissions without a real user.
    if (!user) {
      return NextResponse.json(
        {
          error: "Account not found for this session. Sign out and sign in again.",
          code: "USER_NOT_FOUND",
        },
        { status: 401 }
      );
    }

    const plan = await getEffectivePlan({
      planId: user?.planId ?? null,
      planExpiry: user?.planExpiry ?? null,
      isPaid: user?.isPaid ?? false,
    });
    // Any non-free tier (paid, plan_onemonth, …) uses hourly/daily/monthly caps from plan_configs.
    const isFreePlan = plan.slug === "free";

    if (isFreePlan) {
      const totalEvals = await prisma.evaluationLog.count({ where: { userId: uid } });
      const limit = plan.evalTotal ?? 2;
      if (totalEvals >= limit) {
        return NextResponse.json(
          {
            error: `You've used all ${limit} free AI evaluation${limit === 1 ? "" : "s"}. Paid plans include more evaluations plus every problem — see Pricing to upgrade.`,
            code: "FREE_LIMIT_REACHED",
          },
          { status: 429 }
        );
      }
    } else {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const monthStart = startOfUtcMonth();
      const [hourCount, dayCount, monthCount] = await Promise.all([
        prisma.evaluationLog.count({ where: { userId: uid, createdAt: { gte: hourAgo } } }),
        prisma.evaluationLog.count({ where: { userId: uid, createdAt: { gte: dayAgo } } }),
        prisma.evaluationLog.count({ where: { userId: uid, createdAt: { gte: monthStart } } }),
      ]);
      if (plan.evalHourly !== null && hourCount >= plan.evalHourly) {
        const oldest = await prisma.evaluationLog.findFirst({
          where: { userId: uid, createdAt: { gte: hourAgo } },
          orderBy: { createdAt: "asc" },
          select: { createdAt: true },
        });
        const refreshAt = oldest ? new Date(oldest.createdAt.getTime() + 60 * 60 * 1000) : null;
        const when = refreshAt
          ? `After ${formatEvalLimitRefresh(refreshAt, limitDisplayTz)}.`
          : "Retry within an hour.";
        return NextResponse.json(
          {
            error: `Max ${plan.evalHourly}/hour. ${when}`,
            code: "EVAL_HOURLY_LIMIT",
            ...(refreshAt && { refreshAt: refreshAt.toISOString() }),
          },
          { status: 429 }
        );
      }
      if (plan.evalDaily !== null && dayCount >= plan.evalDaily) {
        const oldest = await prisma.evaluationLog.findFirst({
          where: { userId: uid, createdAt: { gte: dayAgo } },
          orderBy: { createdAt: "asc" },
          select: { createdAt: true },
        });
        const refreshAt = oldest ? new Date(oldest.createdAt.getTime() + 24 * 60 * 60 * 1000) : null;
        const when = refreshAt
          ? `After ${formatEvalLimitRefresh(refreshAt, limitDisplayTz)}.`
          : "Retry within 24 hours.";
        return NextResponse.json(
          {
            error: `Max ${plan.evalDaily}/day. ${when}`,
            code: "EVAL_DAILY_LIMIT",
            ...(refreshAt && { refreshAt: refreshAt.toISOString() }),
          },
          { status: 429 }
        );
      }
      if (plan.evalMonthly !== null && monthCount >= plan.evalMonthly) {
        const monthReset = startOfNextUtcMonth();
        const when = `Resets ${formatEvalLimitRefresh(monthReset, limitDisplayTz)}.`;
        return NextResponse.json(
          {
            error: `Max ${plan.evalMonthly}/month. ${when}`,
            code: "EVAL_MONTHLY_LIMIT",
            refreshAt: monthReset.toISOString(),
          },
          { status: 429 }
        );
      }
    }

    // ── API keys: user key, or platform primary + optional PLATFORM_FALLBACK_API_KEY ──
    const platformKeys = platformKeysInOrder();
    let keysToTry: string[];

    if (user?.apiKey?.trim()) {
      keysToTry = [user.apiKey.trim()];
    } else if (platformKeys.length > 0) {
      keysToTry = platformKeys;
    } else {
      return NextResponse.json(
        { error: "Evaluation is temporarily unavailable. Please try again later." },
        { status: 422 }
      );
    }

    const problem = ALL_PROBLEMS.find((p) => p.id === problemId);
    if (!problem) return NextResponse.json({ error: "Problem not found" }, { status: 404 });

    const userPrompt = generateEvalPrompt(problem, answer);
    const savedModel = user?.aiModel?.trim();

    let jsonText = "";
    let modelUsed = "";
    let lastError = "";

    keyLoop: for (const apiKey of keysToTry) {
      const provider = detectProvider(apiKey);
      const modelQueue = buildModelQueue(provider, savedModel);

      for (const model of modelQueue) {
        try {
          if (provider === "gemini") {
            jsonText = await callGemini(apiKey, model, SYSTEM_PROMPT, userPrompt);
          } else if (provider === "anthropic") {
            jsonText = await callAnthropic(apiKey, model, SYSTEM_PROMPT, userPrompt);
          } else if (provider === "groq") {
            jsonText = await callOpenAICompat(apiKey, model, SYSTEM_PROMPT, userPrompt, "https://api.groq.com/openai/v1");
          } else {
            jsonText = await callOpenAICompat(apiKey, model, SYSTEM_PROMPT, userPrompt);
          }
          modelUsed = model;
          break keyLoop;
        } catch (e: unknown) {
          const ex = e as { isRateLimit?: boolean; status?: number };
          lastError = e instanceof Error ? e.message : String(e);
          const status = ex.status;
          if (status === 401 || status === 403) {
            return NextResponse.json({ error: lastError }, { status: 502 });
          }
          const tryNext =
            ex.isRateLimit === true ||
            status === 404 ||
            status === 429 ||
            status === 503 ||
            /not found|NOT_FOUND|was not found|does not exist|invalid model|model.*not found|is not supported|UNAVAILABLE|returned no text|high demand|overloaded|capacity|try again later/i.test(
              lastError
            );
          if (tryNext) continue;
          return NextResponse.json({ error: lastError }, { status: 502 });
        }
      }
    }

    if (!modelUsed) {
      const rateish =
        /429|503|rate|quota|resource_exhausted|too many requests|high demand|overloaded|capacity|try again later/i.test(
          lastError
        );
      return NextResponse.json(
        {
          error: rateish
            ? "Our AI providers are busy right now. Please try again in a minute."
            : `Could not run evaluation. ${lastError}`,
        },
        { status: rateish ? 429 : 502 }
      );
    }

    jsonText = jsonText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "").trim();

    let result: EvalResult;
    try {
      result = JSON.parse(jsonText);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON. Try again.", raw: jsonText }, { status: 502 });
    }

    result.modelUsed = modelUsed;
    const feedbackJson = JSON.stringify(result);

    await prisma.submission.upsert({
      where: { userId_problemId: { userId: uid, problemId } },
      update: { answer, score: result.total, feedback: feedbackJson, completed: result.total >= AUTO_COMPLETE_MIN_SCORE },
      create: { userId: uid, problemId, answer, score: result.total, feedback: feedbackJson, completed: result.total >= AUTO_COMPLETE_MIN_SCORE },
    });

    await prisma.evaluationLog.create({
      data: { userId: uid, problemId, code: answer, language, score: result.total, feedback: feedbackJson, modelUsed },
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[evaluate] unhandled error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

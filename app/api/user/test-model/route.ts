import { NextRequest, NextResponse } from "next/server";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

function detectProvider(key: string) {
  if (key.startsWith("sk-ant-")) return "anthropic";
  if (key.startsWith("AIza"))    return "gemini";
  if (key.startsWith("gsk_"))    return "groq";
  return "openai";
}

const PING = "Reply with just the word: OK";

export async function POST(req: NextRequest) {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { model } = await req.json();
  if (!model) return NextResponse.json({ ok: false, error: "model required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: uid }, select: { apiKey: true } });
  if (!user?.apiKey) return NextResponse.json({ ok: false, error: "No API key" }, { status: 422 });

  const apiKey = user.apiKey.trim();
  const provider = detectProvider(apiKey);

  try {
    if (provider === "gemini") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: PING }] }], generationConfig: { maxOutputTokens: 10 } }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return NextResponse.json({ ok: false, error: err?.error?.message ?? `HTTP ${res.status}` });
      }
      return NextResponse.json({ ok: true });

    } else if (provider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model, max_tokens: 10, messages: [{ role: "user", content: PING }] }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return NextResponse.json({ ok: false, error: err?.error?.message ?? `HTTP ${res.status}` });
      }
      return NextResponse.json({ ok: true });

    } else {
      // OpenAI or Groq (both OpenAI-compatible)
      const openai = new OpenAI({ apiKey, ...(provider === "groq" ? { baseURL: "https://api.groq.com/openai/v1" } : {}) });
      await openai.chat.completions.create({
        model, max_tokens: 10,
        messages: [{ role: "user", content: PING }],
      });
      return NextResponse.json({ ok: true });
    }
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
}

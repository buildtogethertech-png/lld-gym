import { NextRequest, NextResponse } from "next/server";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";

function detectProvider(key: string) {
  if (key.startsWith("sk-ant-")) return "anthropic";
  if (key.startsWith("AIza")) return "gemini";
  if (key.startsWith("gsk_")) return "groq";
  return "openai";
}

export async function GET(req: NextRequest) {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: { apiKey: true, aiModel: true },
  });
  if (!user?.apiKey) return NextResponse.json({ error: "No API key saved" }, { status: 422 });

  const apiKey = user.apiKey.trim();
  const provider = detectProvider(apiKey);

  try {
    if (provider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/models", {
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      });
      const data = await res.json();
      if (!res.ok) return NextResponse.json({ error: data.error?.message ?? "Anthropic error" }, { status: 502 });
      const models = (data.data ?? [])
        .map((m: { id: string; display_name?: string }) => ({ id: m.id, name: m.display_name ?? m.id }))
        .sort((a: { id: string }, b: { id: string }) => b.id.localeCompare(a.id));
      return NextResponse.json({ provider, models, savedModel: user.aiModel });

    } else if (provider === "gemini") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      const data = await res.json();
      if (!res.ok) return NextResponse.json({ error: data.error?.message ?? "Gemini error" }, { status: 502 });
      const models = (data.models ?? [])
        .filter((m: { name: string; supportedGenerationMethods?: string[] }) =>
          m.supportedGenerationMethods?.includes("generateContent") &&
          (m.name.includes("gemini-1.5") ||
            m.name.includes("gemini-2") ||
            m.name.includes("gemini-3") ||
            m.name.includes("gemini-pro"))
        )
        .map((m: { name: string; displayName?: string }) => ({
          id: m.name.replace("models/", ""),
          name: m.displayName ?? m.name.replace("models/", ""),
        }))
        .sort((a: { id: string }, b: { id: string }) => b.id.localeCompare(a.id));
      return NextResponse.json({ provider, models, savedModel: user.aiModel });

    } else if (provider === "groq") {
      const res = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const data = await res.json();
      if (!res.ok) return NextResponse.json({ error: data.error?.message ?? "Groq error" }, { status: 502 });
      const models = (data.data ?? [])
        .map((m: { id: string }) => ({ id: m.id, name: m.id }))
        .sort((a: { id: string }, b: { id: string }) => b.id.localeCompare(a.id));
      return NextResponse.json({ provider, models, savedModel: user.aiModel });

    } else {
      // OpenAI
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const data = await res.json();
      if (!res.ok) return NextResponse.json({ error: data.error?.message ?? "OpenAI error" }, { status: 502 });
      const models = (data.data ?? [])
        .filter((m: { id: string }) =>
          m.id.startsWith("gpt-4") || m.id.startsWith("gpt-3.5") || m.id.startsWith("o1") || m.id.startsWith("o3")
        )
        .map((m: { id: string }) => ({ id: m.id, name: m.id }))
        .sort((a: { id: string }, b: { id: string }) => b.id.localeCompare(a.id));
      return NextResponse.json({ provider, models, savedModel: user.aiModel });
    }
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { model } = await req.json();
  if (!model) return NextResponse.json({ error: "model required" }, { status: 400 });

  await prisma.user.update({ where: { id: uid }, data: { aiModel: model } });
  return NextResponse.json({ ok: true });
}

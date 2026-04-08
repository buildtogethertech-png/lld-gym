import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUid } from "@/lib/get-uid";

function prismaErrorResponse(e: unknown) {
  console.error("[api/user/apikey]", e);
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2025") {
      return NextResponse.json(
        { error: "No matching user in database. Sign out and sign in again." },
        { status: 401 }
      );
    }
  }
  return NextResponse.json({ error: "Database error" }, { status: 500 });
}

export async function GET(req: NextRequest) {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({ where: { id: uid }, select: { apiKey: true } });
    const key = user?.apiKey ?? null;
    const masked = key ? key.slice(0, 8) + "••••••••" + key.slice(-4) : null;
    return NextResponse.json({ hasKey: !!key, masked });
  } catch (e) {
    return prismaErrorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const apiKey = typeof body === "object" && body !== null && "apiKey" in body
    ? (body as { apiKey: unknown }).apiKey
    : undefined;
  if (typeof apiKey !== "string" || !apiKey.trim()) {
    return NextResponse.json({ error: "apiKey required" }, { status: 400 });
  }

  try {
    await prisma.user.update({ where: { id: uid }, data: { apiKey: apiKey.trim() } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return prismaErrorResponse(e);
  }
}

export async function DELETE(req: NextRequest) {
  const uid = await getUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await prisma.user.update({ where: { id: uid }, data: { apiKey: null } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return prismaErrorResponse(e);
  }
}

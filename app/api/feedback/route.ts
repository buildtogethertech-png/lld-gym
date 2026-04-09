import { NextResponse } from "next/server";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";
import { sendFeedbackMail } from "@/lib/mailer";

const TYPES: Record<string, string> = {
  bug: "🐛 Bug Report",
  feature: "✨ Feature Request",
  other: "💬 Other",
};

export async function POST(req: Request) {
  const uid = await getUid();

  const { type, message } = await req.json();
  if (!type || !message?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (!TYPES[type]) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  if (message.trim().length > 2000) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  // Get user info if logged in
  let userInfo = "Anonymous";
  let userEmail = "—";
  if (uid) {
    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { name: true, email: true },
    });
    if (user) {
      userInfo = user.name ?? user.email ?? uid;
      userEmail = user.email ?? "—";
    }
  }

  const label = TYPES[type];
  const subject = `${label} from ${userInfo}`;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f0f0f;color:#e5e7eb;padding:32px;border-radius:12px">
      <h2 style="margin:0 0 4px;color:#facc15">${label}</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:13px">Submitted via LLD Hub feedback form</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
        <tr>
          <td style="padding:8px 12px;background:#161616;border-radius:8px 8px 0 0;color:#9ca3af;width:100px">From</td>
          <td style="padding:8px 12px;background:#161616;border-radius:0 8px 0 0;color:#e5e7eb">${userInfo}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#1a1a1a;color:#9ca3af">Email</td>
          <td style="padding:8px 12px;background:#1a1a1a;color:#e5e7eb">${userEmail}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#161616;border-radius:0 0 0 8px;color:#9ca3af">Type</td>
          <td style="padding:8px 12px;background:#161616;border-radius:0 0 8px 0;color:#e5e7eb">${label}</td>
        </tr>
      </table>

      <div style="background:#161616;border-radius:8px;padding:16px;font-size:14px;line-height:1.7;color:#d1d5db;white-space:pre-wrap">${message.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
    </div>
  `;

  try {
    await sendFeedbackMail(subject, html);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[feedback] mail failed", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}

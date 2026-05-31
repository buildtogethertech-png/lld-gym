import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { NUDGE_SCHEDULE, NUDGE_CUTOFF_DAYS } from "@/lib/nudge-config";
import { sendHtmlMail } from "@/lib/mailer";

// Protect cron endpoint — only callable with the secret
function isAuthorized(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

function loadTemplate(filename: string, name: string, days: number): string {
  const filePath = path.join(process.cwd(), "emails", filename);
  let html = fs.readFileSync(filePath, "utf-8");
  html = html.replace(/Gaurav/g, name || "there");
  html = html.replace(/\{\{days\}\}/g, String(days));
  return html;
}

async function sendEmail(to: string, subject: string, html: string) {
  await sendHtmlMail({ to, subject, html, fromDisplayName: "LLD Hub" });
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isTest = req.nextUrl.searchParams.get("test") === "1";
  const now = new Date();
  const results: { email: string; day: number; isPaid: boolean }[] = [];

  for (const interval of NUDGE_SCHEDULE) {
    // Window: last submission was between interval.day and interval.day+1 days ago
    const windowStart = new Date(now);
    windowStart.setDate(windowStart.getDate() - (isTest ? 9999 : interval.day + 1));

    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() - (isTest ? 0 : interval.day));

    // All registered users — no submission required
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isPaid: true,
        createdAt: true,
        submissions: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: { updatedAt: true },
        },
      },
    });

    for (const user of users) {
      // Use last submission date if exists, otherwise fall back to account creation date
      const lastAt = user.submissions[0]
        ? new Date(user.submissions[0].updatedAt)
        : new Date(user.createdAt);

      // Check if their last activity falls in this day window
      if (lastAt >= windowStart && lastAt < windowEnd) {
        const template = user.isPaid ? interval.templatePaid : interval.templateFree;
        const firstName = user.name?.split(" ")[0] ?? "there";
        const html = loadTemplate(template, firstName, interval.day);

        await sendEmail(user.email, interval.subject, html);
        results.push({ email: user.email, day: interval.day, isPaid: user.isPaid });
      }
    }
  }

  return NextResponse.json({
    sent: results.length,
    details: results,
    cutoffDays: NUDGE_CUTOFF_DAYS,
  });
}

import { Resend } from "resend";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

/** Inbound address for feedback submissions (your team inbox). */
const FEEDBACK_INBOX = process.env.FEEDBACK_INBOX?.trim() || "support@lldhub.in";

let resendClient: Resend | null | undefined;
let smtpCached: Transporter | null | undefined;

function getResend(): Resend | null {
  if (resendClient !== undefined) return resendClient;
  const key = process.env.RESEND_API_KEY?.trim();
  resendClient = key ? new Resend(key) : null;
  return resendClient;
}

/**
 * Outbound mail:
 *
 * 1) **Resend** — `RESEND_API_KEY` + `EMAIL_FROM` whose **domain must exactly match** a domain you added under
 *    https://resend.com/domains (e.g. only `support.lldhub.in` verified → use `noreply@support.lldhub.in`, not `@lldhub.in`).
 *    Optional: `EMAIL_REPLY_TO` so “Reply” goes to your real inbox (e.g. support@lldhub.in).
 * 2) **SMTP** — `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, optional `SMTP_PORT` / `SMTP_SECURE`.
 */
function getSmtpTransporter(): Transporter | null {
  if (smtpCached !== undefined) return smtpCached;

  const host = process.env.SMTP_HOST?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();

  if (host && smtpUser && smtpPass) {
    const port = Number.parseInt(process.env.SMTP_PORT ?? "587", 10);
    const secure =
      process.env.SMTP_SECURE === "1" ||
      process.env.SMTP_SECURE === "true" ||
      port === 465;
    smtpCached = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user: smtpUser, pass: smtpPass },
    });
    return smtpCached;
  }

  smtpCached = null;
  return null;
}

function resolveFrom(displayName: string): string | null {
  const explicit = process.env.EMAIL_FROM?.trim();
  if (explicit) return explicit;
  const u = process.env.SMTP_USER?.trim();
  if (u) return `"${displayName}" <${u}>`;
  return null;
}

function replyToHeader(): string | undefined {
  return process.env.EMAIL_REPLY_TO?.trim() || undefined;
}

async function sendHtmlMail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  fromDisplayName: string;
  /** When true, omit “no provider” warning (caller documents skip). */
  quietIfUnconfigured?: boolean;
}) {
  const from = resolveFrom(opts.fromDisplayName);
  if (!from) {
    if (!opts.quietIfUnconfigured) {
      console.warn("[mailer] skipped — set EMAIL_FROM (required for Resend) or SMTP_USER with SMTP");
    }
    return;
  }

  const replyTo = replyToHeader();

  const resend = getResend();
  if (resend) {
    const { error } = await resend.emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    });
    if (error) {
      const hint =
        error.name === "invalid_from_address" || /not verified/i.test(error.message)
          ? " Use an address on a domain listed as Verified in Resend (or add lldhub.in there)."
          : "";
      throw new Error(`${error.message}${hint}`);
    }
    return;
  }

  const tx = getSmtpTransporter();
  if (!tx) {
    if (!opts.quietIfUnconfigured) {
      console.warn("[mailer] skipped — set RESEND_API_KEY or SMTP_*");
    }
    return;
  }

  await tx.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    ...(replyTo ? { replyTo } : {}),
  });
}

export async function sendAdminMail(subject: string, html: string) {
  const to = process.env.ADMIN_NOTIFY_EMAIL?.trim() || FEEDBACK_INBOX;
  await sendHtmlMail({ to, subject, html, fromDisplayName: "LLD Hub" });
}

export async function sendFeedbackMail(subject: string, html: string) {
  await sendHtmlMail({
    to: FEEDBACK_INBOX,
    subject,
    html,
    fromDisplayName: "LLD Hub Feedback",
  });
}

export type PurchaseReceiptPayload = {
  to: string;
  customerName: string | null;
  planName: string;
  amountInr: number;
  /** Same as DB `Payment.invoiceId`. */
  invoiceId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  paidAt: Date;
};

/** HTML receipt + welcome. Skips if no provider; logs if misconfigured. */
export async function sendPurchaseReceiptEmail(p: PurchaseReceiptPayload) {
  const name = p.customerName?.trim() || "there";
  const rupees = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p.amountInr);
  const invoiceId = p.invoiceId;
  const dateStr = p.paidAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  const html = `
<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:560px">
  <p>Hi ${escapeHtml(name)},</p>
  <p><strong>Welcome to LLD Hub.</strong> Your payment went through — thank you. Keep practising LLD; consistency is what makes the difference.</p>
  <hr style="border:none;border-top:1px solid #eee;margin:20px 0" />
  <p style="font-size:13px;text-transform:uppercase;letter-spacing:0.05em;color:#666">Receipt</p>
  <table style="font-size:14px;border-collapse:collapse">
    <tr><td style="padding:4px 24px 4px 0;color:#666">Invoice</td><td>${escapeHtml(invoiceId)}</td></tr>
    <tr><td style="padding:4px 24px 4px 0;color:#666">Date</td><td>${escapeHtml(dateStr)}</td></tr>
    <tr><td style="padding:4px 24px 4px 0;color:#666">Plan</td><td>${escapeHtml(p.planName)}</td></tr>
    <tr><td style="padding:4px 24px 4px 0;color:#666">Amount</td><td><strong>${rupees}</strong></td></tr>
    <tr><td style="padding:4px 24px 4px 0;color:#666">Payment ID</td><td style="font-family:monospace;font-size:12px">${escapeHtml(p.razorpayPaymentId)}</td></tr>
    <tr><td style="padding:4px 24px 4px 0;color:#666">Order ID</td><td style="font-family:monospace;font-size:12px">${escapeHtml(p.razorpayOrderId)}</td></tr>
  </table>
  <p style="font-size:12px;color:#666;margin-top:20px">GST not applicable — seller not registered under GST.</p>
  <p style="margin-top:24px">Questions? Reply to this email.</p>
  <p>— Team LLD Hub</p>
</body></html>`;

  await sendHtmlMail({
    to: p.to,
    subject: `Welcome to LLD Hub — receipt ${invoiceId}`,
    html,
    fromDisplayName: "LLD Hub",
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

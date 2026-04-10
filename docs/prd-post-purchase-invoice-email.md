# PRD — Post-purchase invoice + welcome email

## 1. Overview

After a customer **successfully pays** for an LLD Hub plan (Razorpay), automatically send them:

1. A **short welcome / congratulations** message encouraging them to practise and grow as an engineer.  
2. A **simple invoice** for the purchase (PDF attachment preferred).

**From:** `LLD Hub <support@lldhub.in>` (use `EMAIL_FROM` + SMTP for `support@lldhub.in` — see `.env.example`; SPF/DKIM should be set at your DNS/host as your provider instructs.)

**To:** Customer email on file (`User.email`).

**Tax note (India, not GST-registered):** Invoice must state that **GST is not applicable** / seller is **not registered under GST** — no GST rate, no fake GSTIN.

---

## 2. Goals

| Goal | Detail |
|------|--------|
| Delight | Immediate confirmation that payment worked + warm onboarding copy. |
| Record | Customer gets a downloadable record (invoice) with amount, plan, payment reference. |
| Compliance (light) | No false GST claims; clear “not registered” wording. |
| Automation | No manual sending for standard successful payments. |

### Non-goals (v1)

- GST calculation, GSTIN on invoice, or GSTR filing automation.  
- Customer billing portal / invoice history UI (can be v2).  
- Multi-currency beyond what Razorpay already settles in (INR focus).  
- Replacing Razorpay’s own receipt email (we send **in addition** or we accept overlap — product decision).

---

## 3. Target users

Anyone who **successfully completes** a paid purchase on LLD Hub (lifetime or subscription plans handled today via `PlanConfig` + Razorpay).

---

## 4. Trigger & idempotency

**Triggers (today’s codebase):**

| Path | When |
|------|------|
| `POST /api/payment/verify` | Client-side flow after Razorpay checkout; signature verified; `Payment` row created. |
| `POST /api/payment/webhook` | `payment.captured` with valid `x-razorpay-signature`; `Payment` row created. |

**Requirement:** Send the email **once per successful payment** (same `razorpayPaymentId` / `Payment.id`), even if both verify and webhook run or the user retries. Reuse existing idempotency:

- After `prisma.payment.create` succeeds (or on unique constraint / “already exists”), enqueue or send only if **no invoice email** was already sent for that payment.

**Suggested implementation:** `InvoiceEmailSent` flag on `Payment` or a small `payment_notifications` table `{ paymentId, sentAt }` with unique `paymentId`.

---

## 5. Functional requirements

### 5.1 Email — transport

- Use **Nodemailer** (already a project dependency) or a provider API (SendGrid, Resend, SES) via SMTP/API.  
- Env: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM="LLD Hub <support@lldhub.in>"` (must match a mailbox or verified sender you control).

### 5.2 Email — content

**Subject (example):**  
`Welcome to LLD Hub — your invoice is inside`

**Body (HTML + plain-text fallback):**

- Greeting: `Hi [Name]` (fallback: first part of email).  
- **Congratulations & welcome** to LLD Hub; short line on practising LLD and growing as an engineer.  
- Mention **invoice attached** (if PDF) or **invoice below** (if HTML-only v1).  
- Support line: reply to same address for questions.  
- Sign-off: Team LLD Hub.

Tone: friendly, professional, no fake tax numbers.

### 5.3 Invoice — data fields

| Field | Source |
|-------|--------|
| Invoice ID | Deterministic e.g. `INV-{year}-{paymentCuidShort}` or sequential from DB — must be unique. |
| Date | Payment `paidAt` / server UTC date at send time. |
| Customer | `User.name`, `User.email`. |
| Line item | Plan display name from `PlanConfig.name` (e.g. “12 Months — LLD Hub”). |
| Amount | `Payment.amountInr` — in this codebase matches `PLAN_MAP` **rupee** price (not Razorpay paise); display as `₹{amountInr}` or `INR {amountInr}`. |
| Payment reference | `razorpayPaymentId`, `razorpayOrderId`. |
| Seller | Legal/trading name + support email + country (India). |
| Footer note | **“GST not applicable — seller not registered under GST.”** |

### 5.4 Invoice — format

- **Preferred v1:** PDF attachment, filename `LLDHub-Invoice-{InvoiceId}.pdf`.  
- **Acceptable v1.1:** HTML invoice section in email body if PDF pipeline slips schedule.  
- **Library options:** `pdfkit`, `@react-pdf/renderer`, or server-rendered HTML → PDF (Puppeteer — heavier).

---

## 6. Flow (sequence)

1. Payment succeeds (verify and/or webhook).  
2. Persist `Payment` (existing).  
3. If not yet notified for this payment:  
   - Generate invoice PDF (or HTML block).  
   - Send email from `support@lld.com`.  
   - Mark notification sent (idempotent).  
4. On failure: log error; optional retry queue (v1 can be “log + manual resend” if needed).

---

## 7. Success criteria

- Email arrives within **~1 minute** of successful payment under normal load.  
- Invoice attachment opens and matches amount + plan + payment IDs.  
- No duplicate emails for the same `razorpayPaymentId`.  
- Invoice contains **no** GST rate or GSTIN; includes **not registered** disclaimer.

---

## 8. Open questions

1. **Legal entity name** on invoice (individual vs company) and registered address line.  
2. ~~**Amount storage**~~ — confirmed: `amountInr` on `Payment` / `RazorpayOrder` stores **rupees** (same as `plan.price`); Razorpay API still uses paise separately.  
3. **Send on verify only, webhook only, or both** — recommend **single internal function** `onPaymentRecorded(paymentId)` called from both paths after successful insert.  
4. Whether to suppress send if Razorpay already emails a receipt (avoid spam).

---

## 9. Future improvements

- User settings: “Download past invoices.”  
- GST registration later: GSTIN, tax lines, place of supply.  
- Logo and brand template on PDF.  
- Admin view: resend invoice.

---

## 10. References in repo

- `app/api/payment/verify/route.ts` — client verify + `Payment.create`.  
- `app/api/payment/webhook/route.ts` — `payment.captured` + `Payment.create`.  
- `prisma/schema.prisma` — `Payment`, `User`, `PlanConfig`.  
- `package.json` — `nodemailer` for outbound mail.

@AGENTS.md

# LLD Gym — Project Checklist

## ✅ Completed

### Core Platform
- [x] 20 LLD problems across Beginner / Intermediate / Advanced
- [x] Problem detail page with requirements, constraints, hints
- [x] Monaco editor (VS Code-style TypeScript editor in browser)
- [x] Auto-save to DB (debounced)
- [x] Copy Evaluation Prompt button (manual AI via ChatGPT/Claude)
- [x] Progress tracker (% completed, per group counts)

### Auth
- [x] Email + password register/login
- [x] Google OAuth login
- [x] JWT session (NextAuth v4)
- [x] User-scoped progress and submissions

### AI Evaluation
- [x] Evaluate with AI button — scores 0–100 across 5 dimensions
- [x] Supports 4 providers: Gemini (free), Groq (free), OpenAI, Anthropic
- [x] Auto-detects provider from key prefix (AIza / gsk_ / sk- / sk-ant-)
- [x] Fallback chain — if model hits rate limit, tries next model automatically
- [x] Fetch available models from API key
- [x] Test each model individually (✓ works / ✗ fail)
- [x] Test all models at once
- [x] Saves last used model per user
- [x] Shows which model evaluated the submission
- [x] Auto-marks problem complete if score ≥ 85

### Settings
- [x] Tutorial tab — step-by-step guide to get free Gemini/Groq key
- [x] API key save/update/delete per user
- [x] Model picker with test buttons

### Payments (Razorpay)
- [x] Razorpay integration (test mode)
- [x] Create order API
- [x] Verify payment signature
- [x] Mark user as paid in DB after successful payment
- [x] Paywall — first 5 problems free, rest locked
- [x] Lock icon on locked problem cards
- [x] Paywall screen on locked problem page
- [x] Pricing page (Free vs Lifetime comparison)
- [x] UPI + Card + Net Banking + Wallet in checkout
- [x] Upgrade button component (reusable)

### Infrastructure
- [x] PostgreSQL via Prisma (DB per env: `lld-gym-development` / `lld-gym-staging` / `lld-gym-production`; default `public` schema)
- [x] Three env files: .env.development, .env.production, .env.example
- [x] npm run fresh (clears .next cache + restarts)
- [x] Build passing cleanly

---

## 🔲 Pending

### Content
- [ ] Expand from 20 → 60 problems
- [ ] Add expected entities per problem (hidden, shown after submission)
- [ ] Add difficulty progression within levels (L1–L10)

### AI Evaluation
- [ ] AI interviewer follow-up mode ("Why did you use inheritance here?")
- [ ] Inline code comments from AI (highlight specific lines)
- [ ] Evaluation history — see past scores per problem

### Payments
- [ ] Switch Razorpay to live mode for production
- [ ] Webhook handler for payment events (redundancy)
- [ ] Admin dashboard — see who paid, revenue, total users

### Auth
- [ ] Forgot password / reset password flow

### UI / UX
- [ ] Landing page (for non-logged-in users)
- [ ] Mobile responsive polish
- [ ] Dark/light mode toggle
- [ ] Onboarding flow for new users (quick tour)

### Platform
- [ ] Deploy to production (Vercel / Railway)
- [ ] Custom domain
- [ ] Error monitoring (Sentry)
- [ ] Analytics (Posthog / Plausible)

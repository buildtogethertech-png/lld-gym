# Release QA — Free vs paid flows

Run automated smoke tests first, then use this list for a quick **visual** pass (especially payments and anything not covered by E2E).

## Commands

```bash
# 1) DB must be migrated and reachable (see .env.development)
npm run e2e:seed          # creates fixed E2E login users (paid + optional free login)
npx playwright install chromium   # first time only

# 2) Start app (or let Playwright start it — see playwright.config.ts)
npm run dev

# 3) In another terminal — the browser opens automatically on your machine (Chromium).
# CI sets CI=true → headless. To force headless locally: E2E_HEADLESS=1 npm run test:e2e
# If the dev server is already on port 3001:
E2E_SKIP_WEBSERVER=1 npm run test:e2e
# Or let Playwright start `npm run dev` for you:
npm run test:e2e
# Interactive picker / debug: npm run test:e2e:ui
# Step through with breakpoints: npm run test:e2e:debug
#
# Seeing “Evaluate with AI” clearly (headed local runs):
# - Default ~1s hover+pause before each evaluate click (`E2E_STEP_PAUSE_MS`, 0 to disable).
# - `E2E_PAUSE_BEFORE_EVAL=1` → Playwright pauses right before that click (resume in the inspector).
# - `E2E_SLOW_MO=80` → slows every action (makes typing slow; use sparingly).

# Headless (CI-style)
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui
```

### Real AI evaluation (optional)

By default E2E **mocks** `/api/evaluate` so tests do not need API keys. To hit the real endpoint:

```bash
E2E_MOCK_EVALUATE=0 npm run test:e2e:headed
```

Requires `PLATFORM_API_KEY` (or user API key flow) as in normal dev.

### Free-plan evaluate clicks (quota-aware)

- **Default:** the free journey clicks **Evaluate with AI once** (smoke), even if `plan_configs.evalTotal` is higher — so you do not burn the whole free lifetime cap in every run.
- **Cap:** if you raise the count, it is **never more than** `evalTotal` from the database (via `GET /api/user/me`).

```bash
# Optional: click Evaluate up to N times in the free journey (still capped by evalTotal)
E2E_FREE_EVAL_UI_CLICKS=5 npm run test:e2e

# Paid journey defaults to 1 evaluate click; override if you accept rate-limit risk:
E2E_PAID_EVAL_UI_CLICKS=2 npm run test:e2e
```

---

## Seeded accounts (after `npm run e2e:seed`)

| Role | Email | Password |
|------|--------|----------|
| Paid E2E | `e2e-paid@lld-hub.test` | `E2eHub_Test_2026!` |
| Free E2E (login-only; specs use fresh register) | `e2e-free@lld-hub.test` | `E2eHub_Test_2026!` |

---

## Free user — manual checklist (by eyes)

Use a **new** incognito window or the **free journey** Playwright spec (registers a new user each run).

- [ ] **Register** — Create account with email + password; lands on home with welcome message.
- [ ] **Login** — Sign out (if available) / new session; sign in works.
- [ ] **Free problem** — Open a foundation problem (e.g. Encapsulation car); **no** paywall.
- [ ] **Code + evaluate** — Editor loads; **Evaluate with AI** returns a score (or clear quota error if limits hit).
- [ ] **UML** — `/uml-practice/new` loads canvas; **Save** shows success; **My Diagrams** lists the diagram.
- [ ] **UML cap** — Usage shows `n/2` on free plan; third save blocked with upgrade/limit message (if you already have 2 diagrams).
- [ ] **Locked problem** — Open a non–free LLD problem (e.g. Food delivery); **paywall** appears for free users.
- [ ] **Pricing / upgrade** — Page loads; checkout flow acceptable for your release (test mode).

---

## Paid user — manual checklist (by eyes)

Log in as **`e2e-paid@lld-hub.test`** (after seed) or a real paid test account.

- [ ] **Login** — Credentials work; home shows access to full catalog intent (no false “free only” banners).
- [ ] **Locked problem** — Open **Food Delivery** (or any `free: false` problem); **editor loads**, not paywall.
- [ ] **Evaluate** — AI evaluate succeeds within plan limits (hourly/daily/monthly), or shows correct rate-limit copy.
- [ ] **UML** — Save works; **My Diagrams** shows higher cap (e.g. `n/100` from `plan_configs`).
- [ ] **Submissions / progress** — Completing/evaluating updates as expected.

---

## What the Playwright specs cover

| Spec | What it does |
|------|----------------|
| `free-user-journey.spec.ts` | Register → free problem → type in Monaco → mock evaluate → score visible → new UML → save → **My Diagrams** lists title |
| `paid-user-journey.spec.ts` | Login seeded paid user → **locked** problem opens editor → mock evaluate → UML save → listed |
| `evaluate-api.spec.ts` | **Real** `POST /api/evaluate`: anonymous → **401**; logged-in new user → **no** Prisma FK / 500 on submissions (expects **422** if no platform key, or **200**/provider errors if keys are set) |

---

## Automated limit checks (no browser)

```bash
NODE_ENV=development npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/verify-free-plan-limits.ts
```

Verifies `plan_configs` free row and DB-side diagram / eval caps (creates a temporary user, then deletes it).

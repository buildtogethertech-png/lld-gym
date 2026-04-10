/**
 * Idempotent E2E users for Playwright (paid journey + optional manual free login).
 *
 *   NODE_ENV=development npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/e2e-seed-users.ts
 *
 * Password for both (documented in docs/release-qa-checklist.md): E2eHub_Test_2026!
 */
import { resolve } from "path";
import { config as loadEnv } from "dotenv";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { getFreePlan, getPaidPlan } from "../lib/plan-config";

loadEnv({ path: resolve(__dirname, "../.env.development"), override: true });

const PASSWORD = "E2eHub_Test_2026!";
const PAID_EMAIL = "e2e-paid@lld-hub.test";
const FREE_EMAIL = "e2e-free@lld-hub.test";

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10);
  const freePlan = await getFreePlan();
  const paidPlan = await getPaidPlan();
  const planExpiry = new Date();
  planExpiry.setFullYear(planExpiry.getFullYear() + 1);

  await prisma.user.upsert({
    where: { email: PAID_EMAIL },
    create: {
      email: PAID_EMAIL,
      name: "E2E Paid",
      password: hash,
      provider: "credentials",
      isPaid: true,
      planId: paidPlan.id,
      planExpiry,
    },
    update: {
      password: hash,
      provider: "credentials",
      isPaid: true,
      planId: paidPlan.id,
      planExpiry,
    },
  });
  console.log("✓", PAID_EMAIL, "→ paid plan", paidPlan.slug);

  await prisma.user.upsert({
    where: { email: FREE_EMAIL },
    create: {
      email: FREE_EMAIL,
      name: "E2E Free",
      password: hash,
      provider: "credentials",
      isPaid: false,
      planId: freePlan.id,
      planExpiry: null,
    },
    update: {
      password: hash,
      provider: "credentials",
      isPaid: false,
      planId: freePlan.id,
      planExpiry: null,
    },
  });
  console.log("✓", FREE_EMAIL, "→ free plan", freePlan.slug);
  console.log("\nPassword for both:", PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

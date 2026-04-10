import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Free plan
  await prisma.planConfig.upsert({
    where: { slug: "free" },
    update: {},
    create: {
      slug: "free",
      name: "Free",
      evalTotal: 2,
      evalHourly: null,
      evalDaily: null,
      evalMonthly: null,
      umlDiagrams: 2,
      noteMaxLength: 8000,
      problemsCount: 5,
      priceInr: null,
      months: null,
      tag: null,
      active: true,
    },
  });

  // Paid plan (limits config — shared across all paid tiers)
  await prisma.planConfig.upsert({
    where: { slug: "paid" },
    update: {},
    create: {
      slug: "paid",
      name: "Pro",
      evalTotal: null,
      evalHourly: 2,
      evalDaily: 20,
      evalMonthly: 100,
      umlDiagrams: 100,
      noteMaxLength: 8000,
      problemsCount: null,
      priceInr: null,
      months: null,
      tag: null,
      active: true,
    },
  });

  // Purchasable tiers (dummy prices for local dev)
  await prisma.planConfig.upsert({
    where: { slug: "plan_onemonth" },
    update: {},
    create: {
      slug: "plan_onemonth",
      name: "1 Month",
      evalTotal: null,
      evalHourly: 2,
      evalDaily: 20,
      evalMonthly: 100,
      umlDiagrams: 100,
      noteMaxLength: 8000,
      problemsCount: null,
      priceInr: 99,       // dummy — change to 299 for production
      months: 1,
      tag: null,
      active: true,
    },
  });

  await prisma.planConfig.upsert({
    where: { slug: "plan_threemonth" },
    update: {},
    create: {
      slug: "plan_threemonth",
      name: "3 Months",
      evalTotal: null,
      evalHourly: 2,
      evalDaily: 20,
      evalMonthly: 100,
      umlDiagrams: 100,
      noteMaxLength: 8000,
      problemsCount: null,
      priceInr: 149,      // dummy — change to 499 for production
      months: 3,
      tag: "RECOMMENDED",
      active: true,
    },
  });

  await prisma.planConfig.upsert({
    where: { slug: "plan_twelvemonth" },
    update: {},
    create: {
      slug: "plan_twelvemonth",
      name: "12 Months",
      evalTotal: null,
      evalHourly: 2,
      evalDaily: 20,
      evalMonthly: 100,
      umlDiagrams: 100,
      noteMaxLength: 8000,
      problemsCount: null,
      priceInr: 199,      // dummy — change to 999 for production
      months: 12,
      tag: null,
      active: true,
    },
  });

  console.log("✓ PlanConfig seeded: free + paid + 3 purchasable tiers");

  // Backfill existing users that have no planId
  const freePlan = await prisma.planConfig.findUnique({ where: { slug: "free" } });
  const paidPlan = await prisma.planConfig.findUnique({ where: { slug: "paid" } });

  if (freePlan && paidPlan) {
    // Paid users → paid plan
    await prisma.user.updateMany({
      where: { isPaid: true, planId: null },
      data: { planId: paidPlan.id },
    });
    // Everyone else → free plan
    await prisma.user.updateMany({
      where: { planId: null },
      data: { planId: freePlan.id },
    });
    console.log("✓ Existing users backfilled with planId");
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

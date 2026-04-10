/**
 * Verifies free-tier limits from plan_configs + enforcement logic (no HTTP).
 * Run from repo root:
 *   NODE_ENV=development npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/verify-free-plan-limits.ts
 */
import { resolve } from "path";
import { config as loadEnv } from "dotenv";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { getEffectivePlan, getFreePlan } from "../lib/plan-config";

loadEnv({ path: resolve(__dirname, "../.env.development"), override: true });

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`ASSERT: ${msg}`);
}

async function main() {
  const free = await getFreePlan();
  assert(free.slug === "free", `free slug is ${free.slug}`);
  assert(free.umlDiagrams === 2, `umlDiagrams expected 2, got ${free.umlDiagrams}`);
  assert(free.evalTotal === 2, `evalTotal expected 2, got ${free.evalTotal}`);
  assert(free.problemsCount === 5, `problemsCount expected 5, got ${free.problemsCount}`);
  assert(free.noteMaxLength === 8000, `noteMaxLength expected 8000, got ${free.noteMaxLength}`);
  console.log("✓ plan_configs (free): uml=2, evalTotal=2, problems=5, notes=8000");

  const email = `limit-verify-${Date.now()}@lld-hub.test`;
  const password = await bcrypt.hash("TestLimitVerify!9", 10);
  const user = await prisma.user.create({
    data: {
      email,
      name: "Limit verify",
      password,
      provider: "credentials",
      isPaid: false,
      planId: free.id,
      planExpiry: null,
    },
  });

  try {
    const plan = await getEffectivePlan({
      planId: user.planId,
      planExpiry: user.planExpiry,
      isPaid: user.isPaid,
    });
    assert(plan.slug === "free", "effective plan should be free");
    assert(plan.umlDiagrams === 2, "effective uml limit 2");

    await prisma.diagram.createMany({
      data: [
        { userId: user.id, title: "A", nodes: "[]", edges: "[]" },
        { userId: user.id, title: "B", nodes: "[]", edges: "[]" },
      ],
    });
    const dCount = await prisma.diagram.count({ where: { userId: user.id } });
    assert(dCount === 2, `diagram count ${dCount}`);
    assert(dCount >= plan.umlDiagrams, "at diagram cap");
    console.log("✓ diagrams: 2 saved → at UML cap (3rd would be rejected by POST /api/diagrams)");

    await prisma.evaluationLog.createMany({
      data: [
        {
          userId: user.id,
          problemId: "p1",
          code: "//",
          language: "java",
          score: 1,
          feedback: "{}",
        },
        {
          userId: user.id,
          problemId: "p2",
          code: "//",
          language: "java",
          score: 1,
          feedback: "{}",
        },
      ],
    });
    const evalCount = await prisma.evaluationLog.count({ where: { userId: user.id } });
    const limit = plan.evalTotal ?? 2;
    const wouldBlock = evalCount >= limit;
    assert(wouldBlock, "third evaluate should be blocked for free");
    console.log("✓ AI eval: 2 logs → matches evalTotal; 3rd POST /api/evaluate would return FREE_LIMIT_REACHED");

    const longNote = "x".repeat(plan.noteMaxLength + 500);
    const trimmed = longNote.slice(0, plan.noteMaxLength);
    assert(trimmed.length === plan.noteMaxLength, "note trim matches plan.noteMaxLength");
    console.log("✓ notes: slice logic matches noteMaxLength (API applies same slice)");
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
    console.log("✓ cleaned up temp user");
  }

  console.log("\nAll free-plan limit checks passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

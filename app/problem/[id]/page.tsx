import { PROBLEMS } from "@/lib/problems";
import { FOUNDATION_PROBLEMS } from "@/lib/foundation-problems";
import { notFound } from "next/navigation";
import ProblemDetailClient from "./ProblemDetailClient";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan } from "@/lib/plan-config";

const ALL_PROBLEMS = [...FOUNDATION_PROBLEMS, ...PROBLEMS];

export function generateStaticParams() {
  return ALL_PROBLEMS.map((p) => ({ id: p.id }));
}

export const dynamic = "force-dynamic";

export default async function ProblemPage({ params }: { params: { id: string } }) {
  const problem = ALL_PROBLEMS.find((p) => p.id === params.id);
  if (!problem) notFound();

  // Determine access server-side — no client flicker
  let isPaid = false;
  const uid = await getUid();
  if (uid) {
    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { isPaid: true, planExpiry: true, planId: true },
    });
    if (user) {
      const plan = await getEffectivePlan(user);
      isPaid = plan.slug !== "free";
    }
  }

  const isLocked = !problem.free && !isPaid;

  return <ProblemDetailClient problem={problem} isLocked={isLocked} isPaid={isPaid} />;
}

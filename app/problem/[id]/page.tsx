import { PROBLEMS } from "@/lib/problems";
import { FOUNDATION_PROBLEMS } from "@/lib/foundation-problems";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProblemDetailClient from "./ProblemDetailClient";
import { getUid } from "@/lib/get-uid";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan } from "@/lib/plan-config";

const ALL_PROBLEMS = [...FOUNDATION_PROBLEMS, ...PROBLEMS];

export function generateStaticParams() {
  return ALL_PROBLEMS.map((p) => ({ id: p.id }));
}

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const problem = ALL_PROBLEMS.find((p) => p.id === params.id);
  if (!problem) return {};

  const diffLabel =
    problem.difficulty <= 3 ? "Beginner" :
    problem.difficulty <= 6 ? "Intermediate" : "Advanced";

  const topicHint = problem.topic ? ` | ${problem.topic}` : "";

  return {
    title: `${problem.title} — LLD Interview Problem (${diffLabel}) | LLD Hub`,
    description: `Practice the ${problem.title} low-level design problem${topicHint}. Get AI-powered feedback scored across OOP, SOLID principles, design patterns, and code quality — just like a real interview.`,
    keywords: [
      `${problem.title.toLowerCase()} lld`,
      `${problem.title.toLowerCase()} low level design`,
      `${problem.title.toLowerCase()} system design interview`,
      "lld interview questions",
      "low level design practice",
      "lld coding problems",
      ...(problem.tags ?? []),
    ],
    openGraph: {
      title: `${problem.title} — LLD Interview Problem | LLD Hub`,
      description: `Practice ${problem.title} with AI evaluation. Scored on OOP, SOLID, and design patterns.`,
      url: `https://lldhub.in/problem/${problem.id}`,
      siteName: "LLD Hub",
      type: "website",
    },
    alternates: {
      canonical: `https://lldhub.in/problem/${problem.id}`,
    },
  };
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: problem.title,
    description: problem.description,
    url: `https://lldhub.in/problem/${problem.id}`,
    educationalLevel: problem.difficulty <= 3 ? "Beginner" : problem.difficulty <= 6 ? "Intermediate" : "Advanced",
    teaches: "Low Level Design",
    provider: { "@type": "Organization", name: "LLD Hub", url: "https://lldhub.in" },
    keywords: (problem.tags ?? []).join(", "),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProblemDetailClient problem={problem} isLocked={isLocked} isPaid={isPaid} />
    </>
  );
}

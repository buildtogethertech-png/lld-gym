import { PROBLEMS } from "@/lib/problems";
import { FOUNDATION_PROBLEMS } from "@/lib/foundation-problems";
import { notFound } from "next/navigation";
import ProblemDetailClient from "./ProblemDetailClient";

const ALL_PROBLEMS = [...FOUNDATION_PROBLEMS, ...PROBLEMS];

export function generateStaticParams() {
  return ALL_PROBLEMS.map((p) => ({ id: p.id }));
}

export default function ProblemPage({ params }: { params: { id: string } }) {
  const problem = ALL_PROBLEMS.find((p) => p.id === params.id);
  if (!problem) notFound();
  return <ProblemDetailClient problem={problem} />;
}

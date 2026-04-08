import { Submission, Progress } from "./types";
import { PROBLEMS } from "./problems";

const SUBMISSIONS_KEY = "lld_submissions";

export function getSubmissions(): Record<string, Submission> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SUBMISSIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getSubmission(problemId: string): Submission | null {
  const submissions = getSubmissions();
  return submissions[problemId] ?? null;
}

export function saveSubmission(submission: Submission): void {
  if (typeof window === "undefined") return;
  const submissions = getSubmissions();
  submissions[submission.problemId] = { ...submission, updatedAt: Date.now() };
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
}

export function markComplete(problemId: string, completed: boolean): void {
  const existing = getSubmission(problemId);
  saveSubmission({
    problemId,
    answer: existing?.answer ?? "",
    completed,
    updatedAt: Date.now(),
  });
}

export function getProgress(): Progress {
  const submissions = getSubmissions();
  const total = PROBLEMS.length;
  const completed = Object.values(submissions).filter((s) => s.completed).length;
  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

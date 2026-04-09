export type Difficulty = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type DifficultyLabel = "Beginner" | "Intermediate" | "Advanced";

export type ProblemCategory = "foundation" | "lld";

export interface Problem {
  id: string;
  title: string;
  difficulty: Difficulty;
  description: string;
  requirements: string[];
  constraints?: string[];
  hints?: string[];
  category?: ProblemCategory;   // undefined = "lld" (backwards compat)
  topic?: string;               // e.g. "OOP", "SOLID", "Patterns"
  free?: boolean;               // true = no paywall
  tags?: string[];              // e.g. ["encapsulation","oop"] — used by Learn page
}

export interface Submission {
  problemId: string;
  answer: string;
  completed: boolean;
  updatedAt: number;
}

export interface Progress {
  total: number;
  completed: number;
  percentage: number;
}

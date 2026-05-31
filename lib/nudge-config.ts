export interface NudgeInterval {
  day: number;           // days since last submission
  subject: string;
  templatePaid: string;  // filename in /emails/
  templateFree: string;
}

// Cron runs daily. Each user hits each window exactly once.
// Window = [day, day+1) so no double-sends if cron is consistent.
export const NUDGE_SCHEDULE: NudgeInterval[] = [
  {
    day: 3,
    subject: "3 days since your last LLD problem",
    templatePaid: "nudge-paid.html",
    templateFree: "nudge-free.html",
  },
  {
    day: 7,
    subject: "A week without LLD practice",
    templatePaid: "nudge-paid.html",
    templateFree: "nudge-free.html",
  },
  {
    day: 14,
    subject: "2 weeks without LLD practice",
    templatePaid: "nudge-paid.html",
    templateFree: "nudge-free.html",
  },
  {
    day: 21,
    subject: "3 weeks since your last LLD problem",
    templatePaid: "nudge-paid.html",
    templateFree: "nudge-free.html",
  },
  {
    day: 28,
    subject: "Last nudge, come back to LLD Hub",
    templatePaid: "nudge-paid.html",
    templateFree: "nudge-free.html",
  },
  // After day 28 — no more emails. User is considered churned.
];

// Only nudge users who have at least 1 submission (they've used the platform)
export const REQUIRE_AT_LEAST_ONE_SUBMISSION = true;

// Stop all nudges after this many days of inactivity
export const NUDGE_CUTOFF_DAYS = 29;

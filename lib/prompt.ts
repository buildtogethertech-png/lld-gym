import { Problem } from "./types";

export function generateEvalPrompt(problem: Problem, answer: string, umlJson?: string): string {
  const problemText = `
Title: ${problem.title}

Description:
${problem.description}

Requirements:
${problem.requirements.map((r, i) => `${i + 1}. ${r}`).join("\n")}
${
  problem.constraints && problem.constraints.length > 0
    ? `\nConstraints:\n${problem.constraints.map((c, i) => `${i + 1}. ${c}`).join("\n")}`
    : ""
}`.trim();

  return `You are a strict Low-Level Design interviewer evaluating a candidate's solution.

Evaluate the solution based on these 5 criteria (20 points each, total 100):

1. Entity Modeling (20) — Are the right entities/classes identified? Are any core objects missing or wrongly modeled? If a UML diagram is provided, check it matches the code's class structure.
2. Relationships (20) — Is composition vs inheritance used correctly? Are associations, aggregations, and dependencies accurate? Cross-check UML arrows with code if diagram is provided.
3. SOLID Principles (20) — Does the design follow SRP, OCP, LSP, ISP, and DIP? Call out violations explicitly.
4. Design Patterns (20) — Are appropriate patterns used where needed? Is overengineering avoided?
5. Code Quality (20) — Is the code readable, extensible, and clean? Are naming conventions followed?

For each criterion, provide:
- A score (0-20)
- Specific what's good ✅
- Specific what's missing or wrong ❌

Then give:
- Total score out of 100
- Overall verdict:
  ❌ < 60 → "Not enough — rethink the design"
  ⚠️ 60-84 → "Good but missing depth — specific areas to improve"
  ✅ 85-94 → "Strong — interview-ready with minor gaps"
  🔥 95+ → "Excellent — solid LLD thinking"

- Top 3 concrete improvements to reach 90%+

Be brutally honest. Do not be polite. This candidate wants real feedback.

---

PROBLEM:
${problemText}

---

CANDIDATE'S SOLUTION:
${answer.trim() || "(No solution provided)"}${
  umlJson
    ? `

---

CANDIDATE'S UML DIAGRAM (JSON — classes and relationships drawn on canvas):
${umlJson}

Evaluate the UML diagram alongside the code. Check:
- Do the classes in the diagram match the classes in the code?
- Are the relationships (inheritance, composition, aggregation) correct?
- Are any important classes missing from the diagram?
- Does the diagram add clarity or contradict the code?`
    : ""
}`;
}

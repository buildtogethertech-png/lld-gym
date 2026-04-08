import { Problem } from "./types";

type LangId = "typescript" | "javascript" | "python" | "java" | "cpp";

// Extract entity names from hints like "Think about: ParkingLot, Floor, Slot"
function extractEntities(problem: Problem): string[] {
  if (!problem.hints) return [];
  for (const hint of problem.hints) {
    const match = hint.match(/Think about[:\s]+([^.]+)/i);
    if (match) {
      return match[1]
        .split(/[,·\n]/)
        .map((e) => e.trim())
        .filter(Boolean);
    }
  }
  return [];
}

// Extract design patterns mentioned in hints
function extractPatterns(problem: Problem): string[] {
  if (!problem.hints) return [];
  const patterns: string[] = [];
  const patternRegex = /Use\s+([A-Z][a-zA-Z\s]+(?:pattern|Pattern))/g;
  for (const hint of problem.hints) {
    let m;
    while ((m = patternRegex.exec(hint)) !== null) {
      patterns.push(m[1].trim());
    }
  }
  return patterns;
}

// Build a short summary of key requirements (first 3)
function keyRequirements(problem: Problem): string[] {
  return problem.requirements.slice(0, 3);
}

// ── Language-specific generators ────────────────────────────────────────────

function tsTemplate(problem: Problem, entities: string[], patterns: string[]): string {
  const entityLines = entities.length
    ? entities.map((e) => `class ${e} {\n  // TODO\n}`).join("\n\n")
    : "class Entity {\n  // TODO\n}";

  return `// ${problem.title}
// ─────────────────────────────────────────────

// === ENTITIES ===
// Suggested: ${entities.length ? entities.join(", ") : "define your core classes here"}

${entityLines}

// === RELATIONSHIPS ===
// Define how entities relate to each other:
// - e.g. ${entities[0] ?? "A"} has many ${entities[1] ?? "B"} (composition)
// - e.g. ${entities[1] ?? "B"} references ${entities[2] ?? "C"} (aggregation)

// === DESIGN PATTERNS ===
${patterns.length ? patterns.map((p) => `// ✦ ${p}`).join("\n") : "// e.g. Strategy, Observer, Factory"}

// === IMPLEMENTATION ===
// ${keyRequirements(problem)[0] ?? ""}
// ${keyRequirements(problem)[1] ?? ""}
// ${keyRequirements(problem)[2] ?? ""}
`;
}

function jsTemplate(problem: Problem, entities: string[], patterns: string[]): string {
  const entityLines = entities.length
    ? entities.map((e) => `class ${e} {\n  // TODO\n}`).join("\n\n")
    : "class Entity {\n  // TODO\n}";

  return `// ${problem.title}
// ─────────────────────────────────────────────

// === ENTITIES ===
// Suggested: ${entities.length ? entities.join(", ") : "define your core classes here"}

${entityLines}

// === RELATIONSHIPS ===
// - e.g. ${entities[0] ?? "A"} has many ${entities[1] ?? "B"}

// === DESIGN PATTERNS ===
${patterns.length ? patterns.map((p) => `// ✦ ${p}`).join("\n") : "// e.g. Strategy, Observer, Factory"}

// === IMPLEMENTATION ===
// ${keyRequirements(problem)[0] ?? ""}
`;
}

function javaTemplate(problem: Problem, entities: string[], patterns: string[]): string {
  const entityLines = entities.length
    ? entities
        .map(
          (e) =>
            `class ${e} {\n    // TODO: fields\n\n    // TODO: methods\n}`
        )
        .join("\n\n")
    : "class Entity {\n    // TODO\n}";

  return `// ${problem.title}
// ─────────────────────────────────────────────

// === ENTITIES ===
// Suggested: ${entities.length ? entities.join(", ") : "define your core classes"}

${entityLines}

// === RELATIONSHIPS ===
// - ${entities[0] ?? "A"} → ${entities[1] ?? "B"} (composition / aggregation / association)
// - ${entities[1] ?? "B"} → ${entities[2] ?? "C"}

// === DESIGN PATTERNS ===
${patterns.length ? patterns.map((p) => `// ✦ ${p}`).join("\n") : "// e.g. Strategy, Observer, Factory"}

// === KEY REQUIREMENTS ===
// 1. ${keyRequirements(problem)[0] ?? ""}
// 2. ${keyRequirements(problem)[1] ?? ""}
// 3. ${keyRequirements(problem)[2] ?? ""}
`;
}

function pythonTemplate(problem: Problem, entities: string[], patterns: string[]): string {
  const entityLines = entities.length
    ? entities
        .map(
          (e) =>
            `class ${e}:\n    def __init__(self):\n        pass  # TODO: fields\n\n    # TODO: methods`
        )
        .join("\n\n")
    : "class Entity:\n    def __init__(self):\n        pass";

  return `# ${problem.title}
# ─────────────────────────────────────────────

# === ENTITIES ===
# Suggested: ${entities.length ? entities.join(", ") : "define your core classes"}

${entityLines}

# === RELATIONSHIPS ===
# - ${entities[0] ?? "A"} has many ${entities[1] ?? "B"}
# - ${entities[1] ?? "B"} references ${entities[2] ?? "C"}

# === DESIGN PATTERNS ===
${patterns.length ? patterns.map((p) => `# ✦ ${p}`).join("\n") : "# e.g. Strategy, Observer, Factory"}

# === KEY REQUIREMENTS ===
# 1. ${keyRequirements(problem)[0] ?? ""}
# 2. ${keyRequirements(problem)[1] ?? ""}
# 3. ${keyRequirements(problem)[2] ?? ""}
`;
}

function cppTemplate(problem: Problem, entities: string[], patterns: string[]): string {
  const entityLines = entities.length
    ? entities
        .map(
          (e) =>
            `class ${e} {\npublic:\n    // TODO: methods\nprivate:\n    // TODO: fields\n};`
        )
        .join("\n\n")
    : "class Entity {\npublic:\n    // TODO\n};";

  return `// ${problem.title}
// ─────────────────────────────────────────────

#include <iostream>
#include <vector>
#include <string>
#include <memory>
using namespace std;

// === ENTITIES ===
// Suggested: ${entities.length ? entities.join(", ") : "define your core classes"}

${entityLines}

// === RELATIONSHIPS ===
// - ${entities[0] ?? "A"} owns ${entities[1] ?? "B"} (unique_ptr = composition)
// - ${entities[1] ?? "B"} references ${entities[2] ?? "C"} (raw ptr / shared_ptr = aggregation)

// === DESIGN PATTERNS ===
${patterns.length ? patterns.map((p) => `// ✦ ${p}`).join("\n") : "// e.g. Strategy, Observer, Factory"}

// === KEY REQUIREMENTS ===
// 1. ${keyRequirements(problem)[0] ?? ""}
// 2. ${keyRequirements(problem)[1] ?? ""}
// 3. ${keyRequirements(problem)[2] ?? ""}
`;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function generateStarterCode(problem: Problem, language: LangId): string {
  const entities = extractEntities(problem);
  const patterns = extractPatterns(problem);

  switch (language) {
    case "typescript": return tsTemplate(problem, entities, patterns);
    case "javascript": return jsTemplate(problem, entities, patterns);
    case "java":       return javaTemplate(problem, entities, patterns);
    case "python":     return pythonTemplate(problem, entities, patterns);
    case "cpp":        return cppTemplate(problem, entities, patterns);
    default:           return javaTemplate(problem, entities, patterns);
  }
}

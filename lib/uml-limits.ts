// ── UML Diagram Save Limits ────────────────────────────────────────────────
// Change these values to adjust how many diagrams each tier can save.

export const UML_LIMITS = {
  free: 2,
  paid: 100,
} as const;

export function getUmlLimit(isPaid: boolean): number {
  return isPaid ? UML_LIMITS.paid : UML_LIMITS.free;
}

/** Normalize Indian mobile input to +91XXXXXXXXXX. Returns null if invalid. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  const local = digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;
  if (!/^[6-9]\d{9}$/.test(local)) return null;
  return `+91${local}`;
}

export function needsPhone(user: { phone: string | null | undefined } | null): boolean {
  return !user?.phone;
}

export function displayPhone(e164: string | null | undefined): string {
  if (!e164) return "";
  return e164.replace(/^\+91/, "");
}

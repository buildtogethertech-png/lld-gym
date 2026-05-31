import { createHmac } from "crypto";

const SECRET = process.env.UNSUBSCRIBE_SECRET ?? "lldhub-unsub-secret";

export function generateUnsubscribeToken(userId: string): string {
  const sig = createHmac("sha256", SECRET).update(userId).digest("hex").slice(0, 32);
  const payload = Buffer.from(userId).toString("base64url");
  return `${payload}.${sig}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  try {
    const userId = Buffer.from(payload, "base64url").toString("utf-8");
    const expected = createHmac("sha256", SECRET).update(userId).digest("hex").slice(0, 32);
    if (sig !== expected) return null;
    return userId;
  } catch {
    return null;
  }
}

export function unsubscribeUrl(userId: string): string {
  const token = generateUnsubscribeToken(userId);
  return `https://lldhub.in/unsubscribe?token=${token}`;
}

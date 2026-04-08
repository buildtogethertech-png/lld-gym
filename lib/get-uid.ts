import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";

/**
 * Reads the session JWT directly from cookies using next/headers.
 * Works reliably in Next.js App Router API routes on Vercel.
 */
export async function getUid(): Promise<string | null> {
  const cookieStore = cookies();

  // NextAuth v4 uses __Secure- prefix on HTTPS, plain name on HTTP
  const sessionToken =
    cookieStore.get("__Secure-next-auth.session-token")?.value ??
    cookieStore.get("next-auth.session-token")?.value;

  if (!sessionToken) return null;

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error("[getUid] NEXTAUTH_SECRET is not set");
    return null;
  }

  try {
    const token = await decode({ token: sessionToken, secret });
    return (token?.id as string) ?? null;
  } catch (err) {
    // Wrong secret, corrupted cookie, or token format change — avoid 500 on API routes
    console.error("[getUid] session JWT decode failed", err);
    return null;
  }
}

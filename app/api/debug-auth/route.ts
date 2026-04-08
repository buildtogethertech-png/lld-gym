import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";

export async function GET() {
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll().map(c => c.name);

  const sessionToken =
    cookieStore.get("__Secure-next-auth.session-token")?.value ??
    cookieStore.get("next-auth.session-token")?.value;

  let decoded: unknown = null;
  let decodeError: string | null = null;

  if (sessionToken) {
    try {
      decoded = await decode({
        token: sessionToken,
        secret: process.env.NEXTAUTH_SECRET!,
      });
    } catch (e) {
      decodeError = String(e);
    }
  }

  return NextResponse.json({
    cookies: allCookies,
    hasSessionToken: !!sessionToken,
    tokenPrefix: sessionToken?.slice(0, 20) ?? null,
    decoded,
    decodeError,
    secret_set: !!process.env.NEXTAUTH_SECRET,
    secret_prefix: process.env.NEXTAUTH_SECRET?.slice(0, 10),
  });
}

import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  type SessionPayload,
  verifySessionToken,
} from "@/lib/auth";

/**
 * Read and verify the current request's session cookie.
 * Returns null when there is no session or the token is invalid/expired —
 * callers must treat null as "not authenticated".
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Require an authenticated session, optionally restricted to specific
 * roles. Throws "UNAUTHENTICATED" or "FORBIDDEN" — API routes should
 * catch these and map to 401 / 403 responses.
 */
export async function requireSession(
  allowedRoles?: Array<SessionPayload["role"]>
): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

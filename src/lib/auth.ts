import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

export type UserRole = "ADMIN" | "SCOUT";

export interface SessionPayload {
  userId: number;
  email: string;
  fullName: string;
  role: UserRole;
  [key: string]: unknown;
}

const SALT_ROUNDS = 12;
const SESSION_COOKIE = "scoutiq_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 hours

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET is not set. Add it to your .env file (see .env.example)."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function verifyPassword(
  plainPassword: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}

export async function createSessionToken(
  payload: SessionPayload
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const SESSION_MAX_AGE = SESSION_DURATION_SECONDS;

/**
 * Throws if `role` is not one of the roles permitted for a route/action.
 * Callers (API routes, server components) should catch and turn this into
 * a 403 response — never trust a client-supplied role.
 */
export function assertRole(role: UserRole, allowed: UserRole[]): void {
  if (!allowed.includes(role)) {
    throw new Error("FORBIDDEN");
  }
}

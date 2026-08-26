import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

// Routes that require any authenticated user.
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/players",
  "/compare",
  "/shortlist",
  "/reports",
  "/admin",
];

// Routes that require the ADMIN role specifically.
const ADMIN_ONLY_PREFIXES = ["/admin"];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

async function readRole(token: string | undefined): Promise<string | null> {
  if (!token || !process.env.AUTH_SECRET) return null;
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return (payload.role as string) ?? null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!matchesPrefix(pathname, PROTECTED_PREFIXES)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const role = await readRole(token);

  if (!role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (matchesPrefix(pathname, ADMIN_ONLY_PREFIXES) && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/players/:path*",
    "/compare/:path*",
    "/shortlist/:path*",
    "/reports/:path*",
    "/admin/:path*",
  ],
};

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { createSessionToken, verifyPassword } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

interface UserRow {
  user_id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: "ADMIN" | "SCOUT";
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email and password." },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  const rows = await query<UserRow[]>(
    `SELECT user_id, full_name, email, password_hash, role
     FROM \`user\` WHERE email = ? LIMIT 1`,
    [email]
  );

  const user = rows[0];

  // Same generic error whether the email is unknown or the password is
  // wrong — never reveal which one failed.
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  const token = await createSessionToken({
    userId: user.user_id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
  });

  await setSessionCookie(token);

  return NextResponse.json({
    user: {
      id: user.user_id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
    },
  });
}

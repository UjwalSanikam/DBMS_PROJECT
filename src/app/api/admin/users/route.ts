import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { requireSession } from "@/lib/session";

interface UserRow {
  user_id: number;
  full_name: string;
  email: string;
  role: "ADMIN" | "SCOUT";
  created_at: string;
}

export async function GET() {
  try {
    await requireSession(["ADMIN"]);
  } catch (err) {
    return unauthorizedResponse(err);
  }

  const users = await query<UserRow[]>(
    `SELECT user_id, full_name, email, role, created_at
     FROM \`user\` ORDER BY created_at DESC`
  );

  return NextResponse.json({ users });
}

const createUserSchema = z.object({
  fullName: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(["ADMIN", "SCOUT"]),
});

export async function POST(request: NextRequest) {
  try {
    await requireSession(["ADMIN"]);
  } catch (err) {
    return unauthorizedResponse(err);
  }

  const body = await request.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const { fullName, email, password, role } = parsed.data;

  try {
    const passwordHash = await hashPassword(password);
    const result = await query<{ insertId: number }>(
      `INSERT INTO \`user\` (full_name, email, password_hash, role)
       VALUES (?, ?, ?, ?)`,
      [fullName, email, passwordHash, role]
    );
    return NextResponse.json(
      { user: { id: result.insertId, fullName, email, role } },
      { status: 201 }
    );
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "ER_DUP_ENTRY"
    ) {
      return NextResponse.json(
        { error: "A user with that email already exists." },
        { status: 409 }
      );
    }
    console.error("Failed to create user:", err);
    return NextResponse.json(
      { error: "Could not create the user." },
      { status: 500 }
    );
  }
}

function unauthorizedResponse(err: unknown) {
  const message = err instanceof Error ? err.message : "UNAUTHENTICATED";
  if (message === "FORBIDDEN") {
    return NextResponse.json(
      { error: "Admin privileges required." },
      { status: 403 }
    );
  }
  return NextResponse.json(
    { error: "Authentication required." },
    { status: 401 }
  );
}

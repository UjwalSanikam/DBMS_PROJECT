import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { requireSession } from "@/lib/session";
import { query } from "@/lib/db";
import { teamInput } from "@/lib/team-input";
import { saveTeam } from "@/lib/team-store";
import { writeError } from "@/lib/write-error";

type Context = { params: Promise<{ id: string }> };
function parseId(id: string) {
  const value = Number(id);
  return /^\d+$/.test(id) && Number.isSafeInteger(value) && value > 0 && value <= 4294967295 ? value : null;
}

export async function PUT(request: NextRequest, context: Context) {
  try {
    const session = await requireSession();
    const id = parseId((await context.params).id);
    if (!id) return NextResponse.json({ error: "Invalid team." }, { status: 400 });
    const parsed = teamInput.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const saved = await saveTeam(session.userId, parsed.data, id);
    if (saved === null) return NextResponse.json({ error: "Team not found." }, { status: 404 });
    return NextResponse.json({ team_id: saved });
  } catch (error) { return writeError(error); }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const session = await requireSession();
    const id = parseId((await context.params).id);
    if (!id) return NextResponse.json({ error: "Invalid team." }, { status: 400 });
    const result = await query<ResultSetHeader>("DELETE FROM custom_team WHERE team_id = ? AND owner_user_id = ?", [id, session.userId]);
    if (!result.affectedRows) return NextResponse.json({ error: "Team not found." }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch (error) { return writeError(error); }
}

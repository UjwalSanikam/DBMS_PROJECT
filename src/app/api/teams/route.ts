import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { teamInput } from "@/lib/team-input";
import { readTeams, saveTeam } from "@/lib/team-store";
import { writeError } from "@/lib/write-error";

export async function GET() {
  try {
    const session = await requireSession();
    return NextResponse.json({ teams: await readTeams(session.userId) });
  } catch (error) { return writeError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const parsed = teamInput.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    return NextResponse.json({ team_id: await saveTeam(session.userId, parsed.data) }, { status: 201 });
  } catch (error) { return writeError(error); }
}

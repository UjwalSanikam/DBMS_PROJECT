import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { writeError } from "@/lib/write-error";
export async function GET() {
  try {
    await requireSession();
    const clubs = await query(`SELECT club_id, club_name FROM club ORDER BY club_name`);
    return NextResponse.json({ clubs });
  } catch (error) { return writeError(error); }
}

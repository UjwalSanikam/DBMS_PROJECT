import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { writeError } from "@/lib/write-error";
import type { TeamPlayer } from "@/lib/formations";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const name = (request.nextUrl.searchParams.get("name") ?? "").trim().slice(0, 120);
    const position = (request.nextUrl.searchParams.get("position") ?? "").trim();
    const players = await query<TeamPlayer[]>(
      `SELECT p.player_id, p.first_name, p.last_name, p.primary_position, p.photo_url, cl.club_name
       FROM player p
       LEFT JOIN player_club pc ON pc.player_id = p.player_id AND pc.is_current = TRUE
       LEFT JOIN club cl ON cl.club_id = pc.club_id
       WHERE CONCAT(p.first_name, ' ', p.last_name) LIKE ?
         AND (? = '' OR p.primary_position = ?)
       ORDER BY p.last_name, p.first_name LIMIT 50`, [`%${name}%`, position, position]);
    return NextResponse.json({ players });
  } catch (error) { return writeError(error); }
}

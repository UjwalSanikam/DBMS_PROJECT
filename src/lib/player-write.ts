import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { query } from "./db";
import { requireSession } from "./session";
import { playerInput } from "./player-input";
import { writeError } from "./write-error";
import { deletePlayerVector } from "./vector-index";

export async function savePlayer(request: NextRequest, id?: number) {
  try {
    await requireSession(["ADMIN"]);
    if (id !== undefined && (!Number.isSafeInteger(id) || id < 1)) return NextResponse.json({ error: "Invalid player id." }, { status: 400 });
    const parsed = playerInput.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    if (id !== undefined) {
      const rows = await query<Array<{player_id: number}>>(`SELECT player_id FROM player WHERE player_id=?`, [id]);
      if (!rows.length) return NextResponse.json({ error: "Player not found." }, { status: 404 });
    }
    const p = parsed.data;
    const values = [p.first_name,p.last_name,p.date_of_birth,p.nationality,p.primary_position,p.secondary_position,p.preferred_foot,p.height_cm];
    const result = await query<ResultSetHeader>(id === undefined
      ? `INSERT INTO player (first_name,last_name,date_of_birth,nationality,primary_position,secondary_position,preferred_foot,height_cm) VALUES (?,?,?,?,?,?,?,?)`
      : `UPDATE player SET first_name=?,last_name=?,date_of_birth=?,nationality=?,primary_position=?,secondary_position=?,preferred_foot=?,height_cm=? WHERE player_id=?`,
      id === undefined ? values : [...values,id], "ADMIN");
    return NextResponse.json({ player_id: id ?? result.insertId, message: id ? "Player saved. Refresh the similarity index to update its profile." : "Player created." }, { status: id ? 200 : 201 });
  } catch (error) { return writeError(error); }
}

export async function removePlayer(id: number) {
  try {
    await requireSession(["ADMIN"]);
    if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ error: "Invalid player id." }, { status: 400 });
    const result = await query<ResultSetHeader>(`DELETE FROM player WHERE player_id=?`, [id], "ADMIN");
    if (!result.affectedRows) return NextResponse.json({ error: "Player not found." }, { status: 404 });
    try { await deletePlayerVector(id); }
    catch { return NextResponse.json({ deleted: true, warning: "Player deleted. Similarity cleanup failed; refresh the index when Qdrant is available." }); }
    return NextResponse.json({ deleted: true });
  } catch (error) { return writeError(error); }
}

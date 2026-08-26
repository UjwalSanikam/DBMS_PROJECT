import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { ResultSetHeader } from "mysql2";
import { requireSession } from "@/lib/session";

interface ShortlistRow {
  shortlist_id: number;
  scout_user_id: number;
  player_id: number;
  player_name: string;
  primary_position: string;
  priority: string;
  status: string;
  reason: string | null;
  created_at: string;
  updated_at: string;
}

function authErrorResponse(err: unknown): NextResponse {
  if (err instanceof Error && err.message === "FORBIDDEN") {
    return NextResponse.json({ error: "Scout privileges required." }, { status: 403 });
  }
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function GET(request: NextRequest) {
  let session;
  try {
    session = await requireSession();
  } catch (err) {
    return authErrorResponse(err);
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status")?.trim();

  const conditions = ["s.scout_user_id = ?"];
  const paramsList: Array<string | number> = [session.userId];
  if (status) {
    conditions.push("s.status = ?");
    paramsList.push(status);
  }

  const shortlist = await query<ShortlistRow[]>(
    `SELECT s.shortlist_id, s.scout_user_id, s.player_id,
            CONCAT(p.first_name, ' ', p.last_name) AS player_name,
            p.primary_position, s.priority, s.status, s.reason,
            s.created_at, s.updated_at
     FROM shortlist s
     INNER JOIN player p ON p.player_id = s.player_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY s.updated_at DESC`,
    paramsList
  );

  return NextResponse.json({ shortlist });
}

export async function POST(request: NextRequest) {
  let session;
  try {
    session = await requireSession(["SCOUT", "ADMIN"]);
  } catch (err) {
    return authErrorResponse(err);
  }

  const body = await request.json();
  const { player_id, priority, status, reason } = body;

  if (!player_id) {
    return NextResponse.json({ error: "player_id is required." }, { status: 400 });
  }

  try {
    const result = await query<ResultSetHeader>(
      `INSERT INTO shortlist (scout_user_id, player_id, priority, status, reason)
       VALUES (?, ?, ?, ?, ?)`,
      [session.userId, player_id, priority ?? "MEDIUM", status ?? "WATCHING", reason ?? null]
    );
    return NextResponse.json({ shortlist_id: result.insertId }, { status: 201 });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "Player already exists in shortlist." },
        { status: 409 }
      );
    }
    const message = err instanceof Error ? err.message : "Failed to add to shortlist.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

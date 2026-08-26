import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { ResultSetHeader } from "mysql2";
import { requireSession } from "@/lib/session";

interface InjuryRow {
  injury_id: number;
  player_id: number;
  injury_type: string;
  body_area: string;
  injury_date: string;
  expected_return_date: string | null;
  actual_return_date: string | null;
  severity: string;
  status: string;
  notes: string | null;
}

function authErrorResponse(err: unknown): NextResponse {
  if (err instanceof Error && err.message === "FORBIDDEN") {
    return NextResponse.json({ error: "Admin privileges required." }, { status: 403 });
  }
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
  } catch (err) {
    return authErrorResponse(err);
  }

  const { id } = await params;
  const playerId = Number(id);
  if (!Number.isInteger(playerId)) {
    return NextResponse.json({ error: "Invalid player id." }, { status: 400 });
  }

  const injuries = await query<InjuryRow[]>(
    `SELECT injury_id, player_id, injury_type, body_area, injury_date,
            expected_return_date, actual_return_date, severity, status, notes
     FROM injury
     WHERE player_id = ?
     ORDER BY injury_date DESC`,
    [playerId]
  );

  return NextResponse.json({ injuries });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(["ADMIN"]);
  } catch (err) {
    return authErrorResponse(err);
  }

  const { id } = await params;
  const playerId = Number(id);
  if (!Number.isInteger(playerId)) {
    return NextResponse.json({ error: "Invalid player id." }, { status: 400 });
  }

  const body = await request.json();
  const {
    injury_type,
    body_area,
    injury_date,
    expected_return_date,
    actual_return_date,
    severity,
    status,
    notes,
  } = body;

  if (!injury_type || !body_area || !injury_date || !severity) {
    return NextResponse.json(
      { error: "injury_type, body_area, injury_date, and severity are required." },
      { status: 400 }
    );
  }

  try {
    const result = await query<ResultSetHeader>(
      `INSERT INTO injury
         (player_id, injury_type, body_area, injury_date, expected_return_date,
          actual_return_date, severity, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        playerId,
        injury_type,
        body_area,
        injury_date,
        expected_return_date ?? null,
        actual_return_date ?? null,
        severity,
        status ?? "ACTIVE",
        notes ?? null,
      ]
    );
    return NextResponse.json({ injury_id: result.insertId }, { status: 201 });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    const message = err instanceof Error ? err.message : "Failed to create injury record.";
    if (code === "ER_SIGNAL_EXCEPTION") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create injury record." }, { status: 500 });
  }
}
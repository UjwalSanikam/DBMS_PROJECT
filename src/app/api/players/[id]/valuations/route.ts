import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { ResultSetHeader } from "mysql2";
import { requireSession } from "@/lib/session";

interface ValuationRow {
  valuation_id: number;
  player_id: number;
  valuation_date: string;
  market_value: string;
  currency: string;
  source_label: string | null;
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

  const valuations = await query<ValuationRow[]>(
    `SELECT valuation_id, player_id, valuation_date, market_value, currency, source_label
     FROM market_value_history
     WHERE player_id = ?
     ORDER BY valuation_date ASC`,
    [playerId]
  );

  return NextResponse.json({ valuations });
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
  const { valuation_date, market_value, currency, source_label } = body;

  if (!valuation_date || market_value === undefined || market_value === null) {
    return NextResponse.json(
      { error: "valuation_date and market_value are required." },
      { status: 400 }
    );
  }

  try {
    const result = await query<ResultSetHeader>(
      `INSERT INTO market_value_history (player_id, valuation_date, market_value, currency, source_label)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE market_value = VALUES(market_value), source_label = VALUES(source_label)`,
      [playerId, valuation_date, market_value, currency ?? "EUR", source_label ?? null]
    );
    return NextResponse.json({ valuation_id: result.insertId }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create valuation.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";
import type { ResultSetHeader } from "mysql2";
import { requireSession } from "@/lib/session";

interface ContractRow {
  contract_id: number;
  player_id: number;
  club_id: number;
  start_date: string;
  end_date: string;
  weekly_salary: string | null;
  release_clause: string | null;
  currency: string;
  contract_status: string;
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

  const contracts = await query<ContractRow[]>(
    `SELECT contract_id, player_id, club_id, start_date, end_date,
            weekly_salary, release_clause, currency, contract_status
     FROM contract
     WHERE player_id = ?
     ORDER BY start_date DESC`,
    [playerId]
  );

  return NextResponse.json({ contracts });
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

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Expected a JSON object." }, { status: 400 });
  }
  const {
    club_id,
    start_date,
    end_date,
    weekly_salary,
    release_clause,
    currency,
    contract_status,
  } = body;

  if (!club_id || !start_date || !end_date) {
    return NextResponse.json(
      { error: "club_id, start_date, and end_date are required." },
      { status: 400 }
    );
  }

  try {
    const resolvedStatus = contract_status ?? "ACTIVE";

    const result = await withTransaction(async (conn) => {
      // Serializes concurrent replacements and restores the old contract
      // automatically if the replacement fails a constraint.
      await conn.execute(`SELECT player_id FROM player WHERE player_id = ? FOR UPDATE`, [playerId]);
      if (resolvedStatus === "ACTIVE") {
        await conn.execute(
        `UPDATE contract SET contract_status = 'EXPIRED'
         WHERE player_id = ? AND contract_status = 'ACTIVE'`,
        [playerId]
      );
      }

      const [inserted] = await conn.execute<ResultSetHeader>(
      `INSERT INTO contract
         (player_id, club_id, start_date, end_date, weekly_salary,
          release_clause, currency, contract_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        playerId,
        club_id,
        start_date,
        end_date,
        weekly_salary ?? null,
        release_clause ?? null,
        currency ?? "EUR",
        resolvedStatus,
      ]
      );
      return inserted;
    }, "ADMIN");
    return NextResponse.json({ contract_id: result.insertId }, { status: 201 });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    const message = err instanceof Error ? err.message : "Failed to create contract.";
    if (code === "ER_SIGNAL_EXCEPTION") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create contract." }, { status: 500 });
  }
}

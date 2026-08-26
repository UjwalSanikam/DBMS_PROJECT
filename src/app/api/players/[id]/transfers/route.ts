import { NextRequest, NextResponse } from "next/server";
import { query, getPool } from "@/lib/db";
import { requireSession } from "@/lib/session";

interface TransferRow {
  transfer_id: number;
  player_id: number;
  from_club_id: number | null;
  to_club_id: number | null;
  transfer_date: string;
  transfer_fee: string | null;
  currency: string;
  transfer_type: string;
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

  const transfers = await query<TransferRow[]>(
    `SELECT transfer_id, player_id, from_club_id, to_club_id, transfer_date,
            transfer_fee, currency, transfer_type, notes
     FROM transfer
     WHERE player_id = ?
     ORDER BY transfer_date DESC`,
    [playerId]
  );

  return NextResponse.json({ transfers });
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
    from_club_id,
    to_club_id,
    transfer_date,
    transfer_fee,
    currency,
    transfer_type,
    notes,
  } = body;

  if (!transfer_date || !transfer_type) {
    return NextResponse.json(
      { error: "transfer_date and transfer_type are required." },
      { status: 400 }
    );
  }

  const pool = getPool();
  try {
    // Uses sp_record_transfer so the TRANSFER insert and the PLAYER_CLUB
    // membership update happen atomically (see migration 013).
    await pool.execute(`CALL sp_record_transfer(?, ?, ?, ?, ?, ?, ?, ?)`, [
      playerId,
      from_club_id ?? null,
      to_club_id ?? null,
      transfer_date,
      transfer_fee ?? null,
      currency ?? "EUR",
      transfer_type,
      notes ?? null,
    ]);
    return NextResponse.json({ message: "Transfer recorded." }, { status: 201 });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    const message = err instanceof Error ? err.message : "Failed to record transfer.";
    if (code === "ER_SIGNAL_EXCEPTION") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to record transfer." }, { status: 500 });
  }
}

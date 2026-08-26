import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { requireSession } from "@/lib/session";

function authErrorResponse(err: unknown): NextResponse {
  if (err instanceof Error && err.message === "FORBIDDEN") {
    return NextResponse.json({ error: "Scout privileges required." }, { status: 403 });
  }
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

async function loadOwnedShortlistEntry(shortlistId: number, scoutUserId: number) {
  const rows = await query<RowDataPacket[]>(
    `SELECT shortlist_id, scout_user_id FROM shortlist WHERE shortlist_id = ?`,
    [shortlistId]
  );
  const entry = rows[0];
  if (!entry) return { entry: null, owned: false };
  return { entry, owned: entry.scout_user_id === scoutUserId };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let session;
  try {
    session = await requireSession(["SCOUT", "ADMIN"]);
  } catch (err) {
    return authErrorResponse(err);
  }

  const { id } = await params;
  const shortlistId = Number(id);
  if (!Number.isInteger(shortlistId)) {
    return NextResponse.json({ error: "Invalid shortlist id." }, { status: 400 });
  }

  const { entry, owned } = await loadOwnedShortlistEntry(shortlistId, session.userId);
  if (!entry) {
    return NextResponse.json({ error: "Shortlist entry not found." }, { status: 404 });
  }
  if (!owned && session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "You can only update your own shortlist entries." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { priority, status, reason } = body;

  const setClauses: string[] = [];
  const setParams: Array<string> = [];
  if (priority) {
    setClauses.push("priority = ?");
    setParams.push(priority);
  }
  if (status) {
    setClauses.push("status = ?");
    setParams.push(status);
  }
  if (reason !== undefined) {
    setClauses.push("reason = ?");
    setParams.push(reason);
  }

  if (setClauses.length === 0) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  await query(
    `UPDATE shortlist SET ${setClauses.join(", ")} WHERE shortlist_id = ?`,
    [...setParams, shortlistId]
  );

  return NextResponse.json({ message: "Shortlist entry updated." });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let session;
  try {
    session = await requireSession(["SCOUT", "ADMIN"]);
  } catch (err) {
    return authErrorResponse(err);
  }

  const { id } = await params;
  const shortlistId = Number(id);
  if (!Number.isInteger(shortlistId)) {
    return NextResponse.json({ error: "Invalid shortlist id." }, { status: 400 });
  }

  const { entry, owned } = await loadOwnedShortlistEntry(shortlistId, session.userId);
  if (!entry) {
    return NextResponse.json({ error: "Shortlist entry not found." }, { status: 404 });
  }
  if (!owned && session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "You can only remove your own shortlist entries." },
      { status: 403 }
    );
  }

  const result = await query<ResultSetHeader>(
    `DELETE FROM shortlist WHERE shortlist_id = ?`,
    [shortlistId]
  );

  return NextResponse.json({ deleted: result.affectedRows > 0 });
}

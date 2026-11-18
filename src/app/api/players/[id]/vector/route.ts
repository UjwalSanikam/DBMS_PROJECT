import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { deletePlayerVector } from "@/lib/vector-index";

export async function DELETE(_request: Request, {params}: {params: Promise<{id: string}>}) {
  try { await requireSession(["ADMIN"]); }
  catch (error) { return NextResponse.json({error: "Administrator access required."}, {status: error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401}); }
  const playerId = Number((await params).id);
  if (!Number.isSafeInteger(playerId) || playerId <= 0) return NextResponse.json({error: "Invalid player id."}, {status: 400});
  try { await deletePlayerVector(playerId); return NextResponse.json({deleted: playerId}); }
  catch { return NextResponse.json({error: "The similarity index is unavailable. Try again after Qdrant restarts."}, {status: 503}); }
}

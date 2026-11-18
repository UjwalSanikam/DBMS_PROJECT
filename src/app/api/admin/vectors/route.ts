import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { rebuildPlayerVectors } from "@/lib/vector-index";

export async function POST() {
  try { await requireSession(["ADMIN"]); }
  catch (error) { return NextResponse.json({error: "Administrator access required."}, {status: error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401}); }
  try { return NextResponse.json(await rebuildPlayerVectors()); }
  catch { return NextResponse.json({error: "The similarity index is unavailable. Check MySQL and Qdrant, then retry."}, {status: 503}); }
}

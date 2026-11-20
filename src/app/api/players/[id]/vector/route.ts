import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { deletePlayerVector, savePlayerVector } from "@/lib/vector-index";
import { getQdrantClient, PLAYER_PROFILES_COLLECTION } from "@/lib/qdrant";

type Context = {params: Promise<{id: string}>};

async function vectorAction(context: Context, action: "read" | "create" | "update") {
  try { await requireSession(action === "read" ? undefined : ["ADMIN"]); }
  catch (error) { return NextResponse.json({error: "Access denied."}, {status: error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401}); }
  const id = Number((await context.params).id);
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({error: "Invalid player id."}, {status: 400});
  try {
    if (action === "read") {
      const client = getQdrantClient();
      const collections = await client.getCollections();
      if (!collections.collections.some(c => c.name === PLAYER_PROFILES_COLLECTION)) return NextResponse.json({error: "Vector not found. Create it first."}, {status: 404});
      const points = await client.retrieve(PLAYER_PROFILES_COLLECTION, {ids: [id], with_vector: true, with_payload: true});
      return points.length ? NextResponse.json({point: points[0]}) : NextResponse.json({error: "Vector not found. Create it first."}, {status: 404});
    }
    const result = await savePlayerVector(id, action === "create");
    return NextResponse.json(result, {status: result.status});
  } catch { return NextResponse.json({error: "Qdrant is unavailable. Start the service and try again."}, {status: 503}); }
}

export async function GET(_request: Request, context: Context) { return vectorAction(context, "read"); }
export async function POST(_request: Request, context: Context) { return vectorAction(context, "create"); }
export async function PUT(_request: Request, context: Context) { return vectorAction(context, "update"); }

export async function DELETE(_request: Request, {params}: {params: Promise<{id: string}>}) {
  try { await requireSession(["ADMIN"]); }
  catch (error) { return NextResponse.json({error: "Administrator access required."}, {status: error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401}); }
  const playerId = Number((await params).id);
  if (!Number.isSafeInteger(playerId) || playerId <= 0) return NextResponse.json({error: "Invalid player id."}, {status: 400});
  try { await deletePlayerVector(playerId); return NextResponse.json({deleted: playerId}); }
  catch { return NextResponse.json({error: "The similarity index is unavailable. Try again after Qdrant restarts."}, {status: 503}); }
}

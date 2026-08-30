import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getDashboardSummary } from "@/lib/dashboard";

export async function GET() {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const summary = await getDashboardSummary();
  return NextResponse.json(summary);
}
import { NextResponse } from "next/server";

export function writeError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "UNAUTHENTICATED") return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  if (message === "FORBIDDEN") return NextResponse.json({ error: "You do not have permission for this action." }, { status: 403 });
  const code = (error as { code?: string })?.code;
  if (["ER_NO_REFERENCED_ROW_2", "ER_CHECK_CONSTRAINT_VIOLATED", "ER_TRUNCATED_WRONG_VALUE", "WARN_DATA_TRUNCATED", "ER_SIGNAL_EXCEPTION"].includes(code ?? "")) {
    return NextResponse.json({ error: "Check the selected records, dates, and field values." }, { status: 400 });
  }
  console.error("Database write failed", error);
  return NextResponse.json({ error: "Could not save changes. Please try again." }, { status: 500 });
}

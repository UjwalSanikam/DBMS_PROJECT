import "dotenv/config";
import { rebuildPlayerVectors } from "@/lib/vector-index";
import { getPool } from "@/lib/db";

rebuildPlayerVectors().then((result) => console.log("Vector index synchronized:", result))
  .catch((err) => { console.error("Rebuilding vectors failed:", err instanceof Error ? err.message : "Unknown error"); process.exitCode = 1; })
  .finally(() => getPool().end());

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withTransaction } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { writeError } from "@/lib/write-error";
import type { RowDataPacket } from "mysql2";

const input = z.object({
  overall_rating: z.number().min(1).max(10),
  strengths: z.string().max(10000).nullable(), weaknesses: z.string().max(10000).nullable(),
  tactical_fit: z.string().max(10000).nullable(), notes: z.string().max(10000).nullable(),
  recommendation: z.enum(["AVOID", "MONITOR", "SHORTLIST", "PRIORITY"]),
});
async function mutate(request: NextRequest, id: number, remove: boolean) {
  try {
    const session = await requireSession(["SCOUT", "ADMIN"]);
    if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({error:"Invalid report id."},{status:400});
    const parsed = remove ? null : input.safeParse(await request.json().catch(() => null));
    if (parsed && !parsed.success) return NextResponse.json({error:parsed.error.issues[0].message},{status:400});
    // Use the privileged pool only with ownership verified under a row lock.
    return await withTransaction(async conn => {
      const [rows] = await conn.execute<RowDataPacket[]>(`SELECT scout_user_id,player_id FROM scout_report WHERE report_id=? FOR UPDATE`,[id]);
      if (!rows.length) return NextResponse.json({error:"Report not found."},{status:404});
      const row = rows[0];
      if (session.role !== "ADMIN" && row.scout_user_id !== session.userId) return NextResponse.json({error:"You can only change your own reports."},{status:403});
      if (remove) await conn.execute(`DELETE FROM scout_report WHERE report_id=? AND scout_user_id=?`,[id,row.scout_user_id]);
      else if (parsed?.success) {
        const p = parsed.data;
        await conn.execute(`UPDATE scout_report SET overall_rating=?,strengths=?,weaknesses=?,tactical_fit=?,recommendation=?,notes=? WHERE report_id=? AND scout_user_id=?`,[p.overall_rating,p.strengths,p.weaknesses,p.tactical_fit,p.recommendation,p.notes,id,row.scout_user_id]);
        if (["SHORTLIST","PRIORITY"].includes(p.recommendation)) {
          const priority = p.recommendation === "PRIORITY" ? "HIGH" : "MEDIUM";
          await conn.execute(`INSERT INTO shortlist (scout_user_id,player_id,priority,status,reason) VALUES (?,?,?,'RECOMMENDED',?) ON DUPLICATE KEY UPDATE priority=?,status='RECOMMENDED'`,[row.scout_user_id,row.player_id,priority,`From scout report: ${p.recommendation}`,priority]);
        }
      }
      return NextResponse.json({message:remove ? "Report deleted." : "Report updated."});
    }, "ADMIN");
  } catch (error) { return writeError(error); }
}
export async function PATCH(request: NextRequest, {params}: {params:Promise<{id:string}>}) { return mutate(request,Number((await params).id),false); }
export async function DELETE(request: NextRequest, {params}: {params:Promise<{id:string}>}) { return mutate(request,Number((await params).id),true); }

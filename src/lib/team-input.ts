import { z } from "zod";
import { FORMATION_NAMES } from "./formations";

export const teamInput = z.object({
  team_name: z.string().trim().min(1, "Give your team a name.").max(80),
  formation: z.enum(FORMATION_NAMES),
  players: z.array(z.object({
    player_id: z.number().int().positive().max(4294967295),
    slot_index: z.number().int().min(0).max(17),
  })).max(18),
}).superRefine(({ players }, ctx) => {
  if (new Set(players.map((p) => p.player_id)).size !== players.length) {
    ctx.addIssue({ code: "custom", message: "A player can only appear once in a team." });
  }
  if (new Set(players.map((p) => p.slot_index)).size !== players.length) {
    ctx.addIssue({ code: "custom", message: "Each position can only have one player." });
  }
});

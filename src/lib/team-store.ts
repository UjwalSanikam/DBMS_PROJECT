import type { ResultSetHeader } from "mysql2";
import { query, withTransaction } from "./db";
import type { SavedTeam, TeamPlayer } from "./formations";
import { teamInput } from "./team-input";
import type { z } from "zod";

export async function readTeams(ownerId: number): Promise<SavedTeam[]> {
  const teams = await query<Omit<SavedTeam, "players">[]>(
    `SELECT team_id, team_name, formation, updated_at FROM custom_team
     WHERE owner_user_id = ? ORDER BY updated_at DESC, team_id DESC`, [ownerId]);
  const players = await query<(TeamPlayer & { team_id: number; slot_index: number })[]>(
    `SELECT tp.team_id, tp.slot_index, p.player_id, p.first_name, p.last_name,
            p.primary_position, p.photo_url, cl.club_name
     FROM custom_team_player tp
     JOIN custom_team t ON t.team_id = tp.team_id
     JOIN player p ON p.player_id = tp.player_id
     LEFT JOIN player_club pc ON pc.player_id = p.player_id AND pc.is_current = TRUE
     LEFT JOIN club cl ON cl.club_id = pc.club_id
     WHERE t.owner_user_id = ? ORDER BY tp.slot_index`, [ownerId]);
  return teams.map((team) => ({ ...team, players: players.filter((p) => p.team_id === team.team_id) }));
}

export async function saveTeam(ownerId: number, input: z.infer<typeof teamInput>, teamId?: number) {
  return withTransaction(async (conn) => {
    let id = teamId;
    if (id !== undefined) {
      const [rows] = await conn.execute("SELECT team_id FROM custom_team WHERE team_id = ? AND owner_user_id = ? FOR UPDATE", [id, ownerId]);
      if (!(rows as unknown[]).length) return null;
      await conn.execute("UPDATE custom_team SET team_name = ?, formation = ?, updated_at = CURRENT_TIMESTAMP WHERE team_id = ? AND owner_user_id = ?", [input.team_name, input.formation, id, ownerId]);
      await conn.execute("DELETE FROM custom_team_player WHERE team_id = ?", [id]);
    } else {
      const [result] = await conn.execute<ResultSetHeader>("INSERT INTO custom_team (owner_user_id, team_name, formation) VALUES (?, ?, ?)", [ownerId, input.team_name, input.formation]);
      id = result.insertId;
    }
    for (const player of input.players) {
      await conn.execute("INSERT INTO custom_team_player (team_id, slot_index, player_id) VALUES (?, ?, ?)", [id, player.slot_index, player.player_id]);
    }
    return id;
  });
}

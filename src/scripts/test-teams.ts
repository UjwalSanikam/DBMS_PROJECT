import "dotenv/config";
import assert from "node:assert/strict";
import { createSessionToken } from "../lib/auth";
import { getPool, query } from "../lib/db";
import { changeFormation, FORMATION_NAMES, formationSlots, type SavedTeam, type TeamPlayer } from "../lib/formations";
import { teamInput } from "../lib/team-input";

const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";

async function main() {
  for (const from of FORMATION_NAMES) {
    assert.equal(formationSlots(from).length, 11);
    for (const to of FORMATION_NAMES) {
      for (const squad of [Array.from({ length: 18 }, (_, i) => i + 1), [1, null, 3, null, 5, null, 7, null, 9, null, 11, 12, null, 14, null, 16, null, 18]]) {
        const changed = changeFormation(squad, from, to);
        assert.deepEqual(changed.filter(Boolean).sort(), squad.filter(Boolean).sort());
        assert.equal(changed[0], 1, "Goalkeeper preserved");
        assert.deepEqual(changed.slice(11), squad.slice(11), "Bench preserved");
      }
    }
  }
  const valid = { team_name: "Team builder verification", formation: "4-3-3", players: [{ player_id: 1, slot_index: 0 }] };
  assert(teamInput.safeParse(valid).success);
  for (const input of [
    { ...valid, team_name: " " }, { ...valid, formation: "9-1" },
    { ...valid, players: [{ player_id: 1, slot_index: 18 }] },
    { ...valid, players: [{ player_id: 1, slot_index: 0 }, { player_id: 1, slot_index: 1 }] },
    { ...valid, players: [{ player_id: 1, slot_index: 0 }, { player_id: 2, slot_index: 0 }] },
  ]) assert(!teamInput.safeParse(input).success);
  console.log("PASS formation changes preserve starters, goalkeeper and bench; invalid lineups rejected");

  const users = await query<{ user_id: number; full_name: string; email: string; role: "ADMIN" | "SCOUT" }[]>("SELECT user_id, full_name, email, role FROM `user` ORDER BY user_id LIMIT 2", [], "ADMIN");
  assert.equal(users.length, 2, "Need two existing users to check ownership");
  const cookies = await Promise.all(users.map(async (user) => `scoutiq_session=${await createSessionToken({ userId: user.user_id, fullName: user.full_name, email: user.email, role: user.role })}`));
  async function request(path: string, method = "GET", body?: unknown, owner = 0) {
    const response = await fetch(base + path, { method, headers: { ...(owner >= 0 ? { Cookie: cookies[owner] } : {}), "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body), redirect: "manual" });
    return { status: response.status, data: await response.json() };
  }
  assert.equal((await request("/api/teams", "GET", undefined, -1)).status, 401);
  assert.equal((await request("/api/teams", "POST", valid, -1)).status, 401);
  assert.equal((await request("/api/teams/players", "GET", undefined, -1)).status, 401);
  const search = await request("/api/teams/players");
  assert.equal(search.status, 200);
  const candidates = search.data.players as TeamPlayer[];
  assert(candidates.length >= 18, "Need 18 existing players for a full squad");
  const exact = await request(`/api/teams/players?name=${encodeURIComponent(`${candidates[0].first_name} ${candidates[0].last_name}`)}`);
  assert(exact.data.players.some((p: TeamPlayer) => p.player_id === candidates[0].player_id));
  const filtered = await request(`/api/teams/players?position=${candidates[0].primary_position}`);
  assert(filtered.data.players.every((p: TeamPlayer) => p.primary_position === candidates[0].primary_position));
  console.log("PASS authentication, full-name search and position filtering");
  let id: number | undefined;
  try {
    const created = await request("/api/teams", "POST", { ...valid, players: [{ player_id: candidates[0].player_id, slot_index: 0 }] });
    assert.equal(created.status, 201); id = created.data.team_id;
    const find = async () => ((await request("/api/teams")).data.teams as SavedTeam[]).find((team) => team.team_id === id)!;
    assert.equal((await find()).players.length, 1);
    const full = { ...valid, formation: "4-2-3-1", players: candidates.slice(0, 18).map((p, slot_index) => ({ player_id: p.player_id, slot_index })) };
    assert.equal((await request(`/api/teams/${id}`, "PUT", full)).status, 200);
    assert.equal((await find()).players.length, 18);
    assert.equal((await find()).formation, "4-2-3-1");
    const swapped = { ...full, players: full.players.map((p, i) => ({ ...p, slot_index: i === 0 ? 11 : i === 11 ? 0 : i })).filter((p) => p.slot_index !== 17) };
    assert.equal((await request(`/api/teams/${id}`, "PUT", swapped)).status, 200);
    const reopened = await find();
    assert.equal(reopened.players.length, 17);
    assert.equal(reopened.players.find((p) => p.slot_index === 0)?.player_id, candidates[11].player_id);
    assert.equal((await request(`/api/teams/${id}`, "PUT", { ...full, players: [full.players[0], full.players[0]] })).status, 400);
    assert.equal((await request(`/api/teams/${id}`, "PUT", { ...full, players: [{ player_id: 4294967295, slot_index: 0 }] })).status, 400);
    assert.equal((await find()).players.length, 17, "Failed update rolls back lineup deletion");
    assert(!((await request("/api/teams", "GET", undefined, 1)).data.teams as SavedTeam[]).some((team) => team.team_id === id));
    assert.equal((await request(`/api/teams/${id}`, "PUT", full, 1)).status, 404);
    assert.equal((await request(`/api/teams/${id}`, "DELETE", undefined, 1)).status, 404);
    assert.equal((await request("/api/teams/invalid", "PUT", full)).status, 400);
    console.log("PASS create, reopen, update, remove, swap, full squad, rollback and owner isolation");
    assert.equal((await request(`/api/teams/${id}`, "DELETE")).status, 200);
    assert.equal((await request(`/api/teams/${id}`, "DELETE")).status, 404);
    assert.equal(await find(), undefined);
    assert.equal((await query<unknown[]>("SELECT * FROM custom_team_player WHERE team_id = ?", [id!])).length, 0);
    id = undefined;
    console.log("PASS delete and cascading lineup cleanup; no test teams retained");
  } finally {
    if (id !== undefined) await request(`/api/teams/${id}`, "DELETE");
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await Promise.all([getPool("ADMIN").end(), getPool("SCOUT").end()]);
});

import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { ResultSetHeader } from "mysql2";
import { getPool, query } from "../lib/db";
import { hashPassword } from "../lib/auth";

const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const tag = randomUUID();
const userIds: number[] = [];
let playerId = 0;
let checks = 0;

async function request(url: string, cookie = "", method = "GET", body?: unknown, expected = 200) {
  const response = await fetch(base + url, { method, headers: { Cookie: cookie, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body), redirect: "manual" });
  assert.equal(response.status, expected, `${method} ${url}: ${await response.clone().text()}`);
  checks++;
  return response;
}

async function login(role: "SCOUT" | "ADMIN") {
  const password = randomUUID();
  const email = `permission-${userIds.length}-${tag}@example.test`;
  const result = await query<ResultSetHeader>("INSERT INTO `user` (full_name,email,password_hash,role) VALUES (?,?,?,?)", [`Permission ${role} ${userIds.length}`, email, await hashPassword(password), role], "ADMIN");
  userIds.push(result.insertId);
  const response = await request("/api/auth/login", "", "POST", { email, password });
  const cookie = response.headers.getSetCookie().map((entry) => entry.split(";")[0]).join("; ");
  const me = await (await request("/api/auth/me", cookie)).json();
  assert.equal(me.user.role, role);
  return cookie;
}

async function deniedSql(role: "SCOUT" | "AUTH", sql: string) {
  await assert.rejects(getPool(role).query(sql), (error: unknown) => ["ER_TABLEACCESS_DENIED_ERROR", "ER_COLUMNACCESS_DENIED_ERROR"].includes((error as { code: string }).code));
  checks++;
}

async function main() {
  try {
    const admin = await login("ADMIN"), scout = await login("SCOUT"), other = await login("SCOUT");
    const ownerId = userIds[1], otherId = userIds[2];
    const profile = { first_name: "Permission", last_name: tag, date_of_birth: "2001-01-01", nationality: "Test", primary_position: "CM", secondary_position: null, preferred_foot: "RIGHT", height_cm: 180 };
    playerId = (await (await request("/api/players", admin, "POST", profile, 201)).json()).player_id;
    const player = `/api/players/${playerId}`;
    const reportBody = { overall_rating: 7, strengths: "Fixture", weaknesses: null, tactical_fit: null, notes: null, recommendation: "MONITOR" };
    await request(`${player}/reports`, scout, "POST", { ...reportBody, scout_user_id: otherId }, 201);
    const ownReports = (await (await request("/api/reports", scout)).json()).reports;
    assert.equal(ownReports.length, 1);
    assert.equal(ownReports[0].scout_user_id, ownerId, "Client-supplied report author must be ignored");
    assert.equal(ownReports[0].can_manage, true);
    assert(ownReports[0].scout_name);
    const report = `/api/reports/${ownReports[0].report_id}`;
    await request("/api/shortlist", scout, "POST", { player_id: playerId, scout_user_id: otherId }, 201);
    const ownShortlist = (await (await request("/api/shortlist", scout)).json()).shortlist;
    assert.equal(ownShortlist[0].scout_user_id, ownerId);
    const shortlist = `/api/shortlist/${ownShortlist[0].shortlist_id}`;
    const teamBody = { team_name: `Permission ${tag}`, formation: "4-3-3", owner_user_id: otherId, players: [{ player_id: playerId, slot_index: 0 }] };
    const teamId = (await (await request("/api/teams", scout, "POST", teamBody, 201)).json()).team_id;
    const team = `/api/teams/${teamId}`;

    const routeCases: [string, string][] = [
      ["GET", "/api/dashboard"], ["GET", "/api/clubs"], ["GET", "/api/players"], ["POST", "/api/players"],
      ["GET", player], ["PATCH", player], ["DELETE", player], ["GET", "/api/players/compare?ids=1,2"],
      ...["contracts", "injuries", "transfers", "valuations", "reports"].flatMap((resource) => [["GET", `${player}/${resource}`], ["POST", `${player}/${resource}`]] as [string, string][]),
      ["GET", `${player}/similar`], ...["GET", "POST", "PUT", "DELETE"].map((method) => [method, `${player}/vector`] as [string, string]),
      ["GET", "/api/reports"], ["PATCH", report], ["DELETE", report],
      ["GET", "/api/shortlist"], ["POST", "/api/shortlist"], ["PATCH", shortlist], ["DELETE", shortlist],
      ["GET", "/api/teams"], ["POST", "/api/teams"], ["PUT", team], ["DELETE", team], ["GET", "/api/teams/players"],
      ["GET", "/api/admin/users"], ["POST", "/api/admin/users"], ["POST", "/api/admin/vectors"],
    ];
    // Fail if an exported API method is missing from this authorization audit.
    const apiDir = path.join(process.cwd(), "src/app/api");
    const exported: string[] = [];
    function visit(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) visit(file);
        else if (entry.name === "route.ts") {
          const route = "/api/" + path.relative(apiDir, path.dirname(file)).replaceAll(path.sep, "/");
          if (!route.startsWith("/api/auth/")) {
            for (const match of fs.readFileSync(file, "utf8").matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)\(/g)) exported.push(`${match[1]} ${route}`);
          }
        }
      }
    }
    visit(apiDir);
    const normalized = routeCases.map(([method, url]) => `${method} ${url.split("?")[0].replace(/\/\d+(?=\/|$)/g, "/[id]")}`);
    assert.deepEqual(normalized.sort(), exported.sort(), "Every non-auth API method must be audited");
    for (const [method, url] of routeCases) await request(url, "", method, method === "GET" || method === "DELETE" ? undefined : {}, 401);
    console.log(`PASS anonymous access denied for all ${routeCases.length} protected API methods`);

    const adminOnly: [string, string][] = [
      ["POST", "/api/players"], ["PATCH", player], ["DELETE", player],
      ...["contracts", "injuries", "transfers", "valuations"].map((resource) => ["POST", `${player}/${resource}`] as [string, string]),
      ...["POST", "PUT", "DELETE"].map((method) => [method, `${player}/vector`] as [string, string]),
      ["GET", "/api/admin/users"], ["POST", "/api/admin/users"], ["POST", "/api/admin/vectors"],
    ];
    for (const [method, url] of adminOnly) await request(url, scout, method, method === "GET" || method === "DELETE" ? undefined : {}, 403);
    for (const url of ["/dashboard", "/players", "/compare", "/shortlist", "/reports", "/teams", "/admin/users"]) {
      assert((await request(url, "", "GET", undefined, 307)).headers.get("location")?.includes("/login"));
    }
    assert((await request("/admin/users", scout, "GET", undefined, 307)).headers.get("location")?.endsWith("/dashboard"));
    for (const url of ["/api/players", "/api/clubs", "/api/dashboard", player, `${player}/contracts`, `${player}/injuries`, `${player}/transfers`, `${player}/valuations`, `${player}/reports`, "/api/teams/players"]) await request(url, scout);
    console.log("PASS scout reads allowed; all 13 admin-only API methods and admin page denied");

    assert.equal((await (await request("/api/reports", other)).json()).reports.length, 0);
    const shared = (await (await request(`${player}/reports`, other)).json()).reports;
    assert.equal(shared[0].scout_user_id, ownerId, "Other scouts can read the named author on a player profile");
    await request(report, other, "PATCH", reportBody, 403);
    await request(report, other, "DELETE", undefined, 403);
    assert.equal((await (await request("/api/shortlist", other)).json()).shortlist.length, 0);
    await request(shortlist, other, "PATCH", { status: "REJECTED" }, 403);
    await request(shortlist, other, "DELETE", undefined, 403);
    assert(!(await (await request("/api/teams", other)).json()).teams.some((entry: { team_id: number }) => entry.team_id === teamId));
    await request(team, other, "PUT", teamBody, 404);
    await request(team, other, "DELETE", undefined, 404);
    const unchanged = (await (await request("/api/reports", scout)).json()).reports[0];
    assert.equal(unchanged.overall_rating, "7.0");
    await request(`${player}/reports`, other, "POST", reportBody, 201);
    await request(`${player}/reports`, admin, "POST", reportBody, 201);
    const adminReports = await (await request("/api/reports", admin)).json();
    assert.equal(adminReports.scope, "all");
    const fixtureReports = adminReports.reports.filter((entry: { player_id: number }) => entry.player_id === playerId);
    assert.equal(fixtureReports.length, 3, "Admin sees both scouts' reports and their own report");
    assert.deepEqual(new Set(fixtureReports.map((entry: { scout_user_id: number }) => entry.scout_user_id)), new Set(userIds));
    for (const entry of fixtureReports) {
      assert.equal(entry.is_own, entry.scout_user_id === userIds[0]);
      assert.equal(entry.can_manage, true);
      assert(entry.scout_name);
    }
    const [{ total }] = await query<{ total: number }[]>("SELECT COUNT(*) AS total FROM scout_report");
    assert.equal(adminReports.reports.length, total, "Admin list includes every report in the database");
    for (const cookie of [scout, other]) {
      const personal = await (await request("/api/reports", cookie)).json();
      assert.equal(personal.scope, "mine");
      assert.equal(personal.reports.length, 1, "Scouts still see only their own reports");
      assert.equal(personal.reports[0].is_own, true);
    }
    console.log("PASS admin sees all report authors with correct ownership labels; scout lists remain private");
    await request(report, scout, "PATCH", { ...reportBody, overall_rating: 8 });
    await request(shortlist, scout, "PATCH", { status: "WATCHING" });
    await request(team, scout, "PUT", teamBody);
    await request(report, admin, "PATCH", { ...reportBody, overall_rating: 9 });
    await request(report, admin, "DELETE");
    await request(shortlist, admin, "DELETE");
    await request(team, admin, "DELETE", undefined, 404); // Personal teams stay private even from another admin session.
    await request(team, scout, "DELETE");
    console.log("PASS report, shortlist and team isolation; owners can edit; admin report moderation allowed");

    const [prefix, token] = scout.split("=");
    const parts = token.split(".");
    const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    parts[1] = Buffer.from(JSON.stringify({ ...claims, role: "ADMIN" })).toString("base64url");
    await request("/api/admin/users", `${prefix}=${parts.join(".")}`, "GET", undefined, 401);
    await request("/api/players", "scoutiq_session=invalid", "GET", undefined, 401);
    await request("/api/auth/logout", scout, "POST");
    assert.equal((await (await request("/api/auth/me")).json()).user, null);
    console.log("PASS actual password logins, role lookup, forged/invalid cookie rejection and public session/logout");

    for (const table of ["player", "club", "league", "contract", "injury", "transfer", "player_club", "player_statistics", "market_value_history", "scout_report"]) {
      await deniedSql("SCOUT", `DELETE FROM ${table} WHERE 1=0`);
      await deniedSql("SCOUT", `UPDATE ${table} SET ${table === "player" ? "first_name=first_name" : table === "club" ? "club_name=club_name" : table === "league" ? "league_name=league_name" : table === "player_statistics" ? "appearances=appearances" : table === "scout_report" ? "overall_rating=overall_rating" : table === "player_club" ? "is_current=is_current" : table === "market_value_history" ? "market_value=market_value" : table === "injury" ? "injury_type=injury_type" : table === "contract" ? "weekly_salary=weekly_salary" : "transfer_fee=transfer_fee"} WHERE 1=0`);
    }
    await deniedSql("SCOUT", "SELECT password_hash FROM `user` LIMIT 0");
    await deniedSql("SCOUT", "UPDATE `user` SET role=role WHERE 1=0");
    await deniedSql("AUTH", "SELECT player_id FROM player LIMIT 0");
    await deniedSql("AUTH", "UPDATE `user` SET role=role WHERE 1=0");
    await query("SELECT user_id, full_name FROM `user` LIMIT 0");
    for (const table of ["shortlist", "custom_team", "custom_team_player"]) {
      await query(`SELECT * FROM ${table} LIMIT 0`);
      await query(`DELETE FROM ${table} WHERE 1=0`);
    }
    const grants: Record<string, string[]> = {};
    for (const role of ["SCOUT", "ADMIN", "AUTH"] as const) {
      const [rows] = await getPool(role).query("SHOW GRANTS FOR CURRENT_USER");
      const assigned = (rows as Record<string, string>[]).flatMap((row) => Object.values(row));
      assert(assigned.some((grant) => grant.includes(`scoutiq_${role.toLowerCase()}_role`)));
      const [effective] = await getPool(role).query(`SHOW GRANTS FOR CURRENT_USER USING 'scoutiq_${role.toLowerCase()}_role'@'%'`);
      grants[role] = (effective as Record<string, string>[]).flatMap((row) => Object.values(row));
      assert(![...assigned, ...grants[role]].some((grant) => /GRANT (?:ALL PRIVILEGES|.*\b(?:CREATE|ALTER|DROP|GRANT OPTION)\b)/.test(grant)), `${role} must not have DDL or grant permissions`);
    }
    console.log("PASS effective database denials, limited authentication account, role assignments and no runtime DDL grants");
    console.log(`PASS ${checks} permission checks. Only disposable fixture records were changed.`);
  } finally {
    if (playerId) await query("DELETE FROM player WHERE player_id=?", [playerId], "ADMIN");
    for (const userId of userIds) await query("DELETE FROM `user` WHERE user_id=?", [userId], "ADMIN");
    await Promise.all([getPool("ADMIN").end(), getPool("SCOUT").end(), getPool("AUTH").end()]);
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

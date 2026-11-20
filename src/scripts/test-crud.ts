import "dotenv/config";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import type {ResultSetHeader} from "mysql2";
import {query,getPool} from "@/lib/db";
import {createSessionToken} from "@/lib/auth";

const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const tag = randomUUID();
const users:number[] = [];
let player = 0;
let checks = 0;
async function request(path:string,cookie:string,method="GET",body?:unknown,status=200) {
  const response = await fetch(base+path,{method,headers:{cookie,"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body),redirect:"manual"});
  assert.equal(response.status,status,`${method} ${path}: ${await response.clone().text()}`);
  checks++;
  return response;
}
async function account(role:"ADMIN"|"SCOUT") {
  const email = `crud-${role}-${users.length}-${tag}@example.test`;
  const result = await query<ResultSetHeader>("INSERT INTO `user` (full_name,email,password_hash,role) VALUES (?,?,?,?)",["CRUD test",email,"disabled-test-login",role],"ADMIN");
  users.push(result.insertId);
  return `scoutiq_session=${await createSessionToken({userId:result.insertId,email,fullName:"CRUD test",role})}`;
}
async function main() {
  try {
    const admin = await account("ADMIN"), scout = await account("SCOUT"), other = await account("SCOUT");
    const profile = {first_name:"CRUD",last_name:tag,date_of_birth:"2001-01-01",nationality:"Test",primary_position:"CM",secondary_position:null,preferred_foot:"RIGHT",height_cm:180};
    await request("/api/players","","POST",profile,401);
    await request("/api/players",scout,"POST",profile,403);
    await request("/api/players",admin,"POST",{...profile,height_cm:18},400);
    player = (await (await request("/api/players",admin,"POST",profile,201)).json()).player_id;
    const root = `/api/players/${player}`;
    assert.equal((await (await request(root,scout)).json()).player.first_name,"CRUD");
    await request(root,admin,"PATCH",{...profile,first_name:"Edited"});
    assert.equal((await (await request(root,scout)).json()).player.first_name,"Edited");
    await request(root,scout,"DELETE",undefined,403);
    const clubs = await query<Array<{club_id:number}>>("SELECT club_id FROM club ORDER BY club_id LIMIT 2");
    assert(clubs.length===2,"Need two existing clubs for transfer tests");
    const [clubA,clubB] = clubs.map(c=>c.club_id);
    await request(`${root}/injuries`,admin,"POST",{injury_type:"Test",body_area:"Knee",injury_date:"2026-01-10",expected_return_date:"2026-01-01",severity:"MINOR"},400);
    await request(`${root}/injuries`,admin,"POST",{injury_type:"Test",body_area:"Knee",injury_date:"2026-01-10",expected_return_date:"2026-01-20",severity:"MINOR"},201);
    await request(`${root}/contracts`,admin,"POST",{club_id:clubA,start_date:"2026-01-01",end_date:"2028-01-01",weekly_salary:1000},201);
    await request(`${root}/contracts`,admin,"POST",{club_id:clubA,start_date:"2026-01-01",end_date:"2025-01-01"},400);
    await request(`${root}/transfers`,admin,"POST",{from_club_id:null,to_club_id:clubA,transfer_date:"2026-01-01",transfer_type:"FREE",transfer_fee:0},201);
    await request(`${root}/transfers`,admin,"POST",{from_club_id:clubA,to_club_id:clubB,transfer_date:"2026-02-01",transfer_type:"PERMANENT",transfer_fee:10},201);
    assert.equal((await (await request(root,scout)).json()).player.club_id,clubB);
    await request(`${root}/valuations`,admin,"POST",{valuation_date:"2026-01-01",market_value:1000},201);
    await request(`${root}/valuations`,admin,"POST",{valuation_date:"2026-01-01",market_value:2000},201);
    await request("/api/shortlist",scout,"POST",{player_id:player,priority:"HIGH",status:"WATCHING",reason:"Test"},201);
    await request("/api/shortlist",scout,"POST",{player_id:player},409);
    const shortlist = (await (await request("/api/shortlist",scout)).json()).shortlist;
    assert.equal(shortlist.length,1);
    await request(`/api/shortlist/${shortlist[0].shortlist_id}`,scout,"PATCH",{status:"NEGOTIATING"});
    await request(`${root}/reports`,scout,"POST",{overall_rating:7,strengths:"Passing",recommendation:"MONITOR"},201);
    const reports = (await (await request("/api/reports",scout)).json()).reports;
    const reportRoot = `/api/reports/${reports[0].report_id}`;
    const report = {overall_rating:8,strengths:"Updated",weaknesses:null,tactical_fit:null,notes:null,recommendation:"PRIORITY"};
    await request(reportRoot,other,"PATCH",report,403);
    await request(reportRoot,other,"DELETE",undefined,403);
    await request(reportRoot,scout,"PATCH",{...report,overall_rating:11},400);
    await request(reportRoot,scout,"PATCH",report);
    assert.equal((await (await request("/api/shortlist",scout)).json()).shortlist[0].status,"RECOMMENDED");
    for (const [url,cookie,text] of [["/players",admin,"Add player"],[`/players/${player}`,admin,"Record injury"],[`/players/${player}`,admin,"Record transfer"],["/shortlist",scout,"Add player to shortlist"]]) {
      const html = await (await request(url,cookie)).text(); assert(html.includes(text),`Missing rendered control: ${text}`);
    }
    const scoutHtml = await (await request(`/players/${player}`,scout)).text();
    assert(!scoutHtml.includes("Edit or delete player"),"Admin controls visible to scout");
    await request(reportRoot,scout,"DELETE");
    await request(reportRoot,scout,"DELETE",undefined,404);
    await request(`/api/shortlist/${shortlist[0].shortlist_id}`,scout,"DELETE");
    await request(root,admin,"DELETE");
    await request(root,admin,"GET",undefined,404);
    for (const table of ["injury","contract","transfer","market_value_history","player_club"]) {
      const rows = await query<Array<{n:number}>>(`SELECT COUNT(*) n FROM ${table} WHERE player_id=?`,[player]); assert.equal(rows[0].n,0);
    }
    player=0;
    console.log(`PASS: ${checks} HTTP checks, ownership, validation, rendered controls, transfer membership and cascading deletion.`);
  } finally {
    if (player) await query("DELETE FROM player WHERE player_id=?",[player],"ADMIN");
    for (const id of users) await query("DELETE FROM `user` WHERE user_id=?",[id],"ADMIN");
    await Promise.all([getPool("SCOUT").end(),getPool("ADMIN").end()]);
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});

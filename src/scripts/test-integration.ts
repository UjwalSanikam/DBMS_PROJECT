import "dotenv/config";
import assert from "node:assert/strict";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import mysql, {type RowDataPacket, type ResultSetHeader} from "mysql2/promise";
import bcrypt from "bcryptjs";
import {getQdrantClient, PLAYER_PROFILES_COLLECTION} from "@/lib/qdrant";
import {buildRawFeatureVectors} from "@/lib/similarity";
import {rebuildPlayerVectors} from "@/lib/vector-index";
import {getPool} from "@/lib/db";

const base = process.env.TEST_BASE_URL ?? "http://localhost:3100";
const results: Array<{id: string; status: string; detail: string}> = [];
async function check(id: string, fn: () => Promise<unknown>) {
  try { await fn(); results.push({id,status:"PASS",detail:"Expected result observed"}); console.log("PASS",id); }
  catch (err) { const detail = err instanceof Error ? err.message.split("\n")[0] : "Unexpected failure"; results.push({id,status:"FAIL",detail});console.error("FAIL",id,detail); }
}
async function expectReject(fn: () => Promise<unknown>, codes: string[]) {
  try { await fn(); } catch (e) { assert(codes.includes((e as {code:string}).code),`Unexpected database rejection: ${(e as {code:string}).code}`);return; }
  assert.fail("Database accepted an operation it should reject");
}
async function request(path: string, cookie="", method="GET", body?: unknown) {
  return fetch(base+path,{method,headers:{...(cookie?{cookie}:{}),...(body?{"Content-Type":"application/json"}:{})},body:body?JSON.stringify(body):undefined,redirect:"manual"});
}
async function login(email: string, password: string) {
  const r=await request("/api/auth/login","","POST",{email,password});assert.equal(r.status,200);
  const cookie=r.headers.getSetCookie().map(value=>value.split(";")[0]).join("; ");assert(cookie.includes("scoutiq_session="));
  return {cookie,response:r};
}

async function main() {
  const db = await mysql.createConnection({host:process.env.MYSQL_HOST,port:Number(process.env.MYSQL_PORT??3306),user:process.env.MYSQL_ROOT_USER??"root",password:process.env.MYSQL_ROOT_PASSWORD,database:process.env.MYSQL_DATABASE,dateStrings:true});
  async function rows(sql: string, values: unknown[]=[]) {const [r]=await db.query<RowDataPacket[]>(sql,values);return r;}
  async function insert(sql: string, values: unknown[]=[]) {const [r]=await db.query<ResultSetHeader>(sql,values);return r.insertId;}
  const suffix=Date.now().toString();const email=`test-${suffix}@example.test`,password=randomUUID()+"aA1!";
  let player=0,otherPlayer=0,scout=0,otherScout=0,league=0,club=0,club2=0;
  let adminCookie="",scoutCookie="",otherCookie="";
  const schema=`scoutiq_verify_${suffix}`;
  const trigger=`test_recommendation_rollback_${suffix}`;
  try {
    await check("SET-03 fresh migrations",async()=>{
      await db.query(`CREATE DATABASE ${mysql.escapeId(schema)} CHARACTER SET utf8mb4`);
      execFileSync(process.execPath,["node_modules/tsx/dist/cli.mjs","src/scripts/migrate.ts"],{env:{...process.env,MYSQL_DATABASE:schema},stdio:"pipe"});
      const r=await rows(`SELECT COUNT(*) n FROM ${mysql.escapeId(schema)}.schema_migrations`);assert.equal(r[0].n,19);
      const v=await rows(`SELECT VIEW_DEFINITION FROM information_schema.VIEWS WHERE TABLE_SCHEMA=? AND TABLE_NAME='vw_contract_expiry'`,[schema]);assert(String(v[0].VIEW_DEFINITION).includes('curdate()'));
    });
    await check("SET-04 repeat migrations",async()=>{
      const output=execFileSync(process.execPath,["node_modules/tsx/dist/cli.mjs","src/scripts/migrate.ts"],{env:{...process.env,MYSQL_DATABASE:schema},encoding:"utf8"});assert.equal((output.match(/Skipping/g)??[]).length,19);
    });
    league=await insert("INSERT INTO league(league_name,country) VALUES (?, 'Test')",["Fixture "+suffix]);
    club=await insert("INSERT INTO club(league_id,club_name,country) VALUES (?,?,'Test')",[league,"Fixture A "+suffix]);
    club2=await insert("INSERT INTO club(league_id,club_name,country) VALUES (?,?,'Test')",[league,"Fixture B "+suffix]);
    player=await insert("INSERT INTO player(first_name,last_name,date_of_birth,nationality,primary_position) VALUES ('Test',?,'2000-01-01','Test','CM')",[suffix]);
    otherPlayer=await insert("INSERT INTO player(first_name,last_name,date_of_birth,nationality,primary_position) VALUES ('Cascade',?,'2000-01-01','Test','CM')",[suffix]);
    await check("SET-05 seeded data",async()=>{assert((await rows('SELECT COUNT(*) n FROM player'))[0].n>=40);assert((await rows('SELECT COUNT(*) n FROM player_statistics'))[0].n>=40);});
    await check("AUTH-01 admin login and secure cookie",async()=>{const l=await login(process.env.SEED_ADMIN_EMAIL!,process.env.SEED_ADMIN_PASSWORD!);adminCookie=l.cookie;assert(l.response.headers.get('set-cookie')?.includes('HttpOnly'));assert(l.response.headers.get('set-cookie')?.includes('SameSite=lax'));});
    await check("AUTH-02 invalid password",async()=>{assert.equal((await request('/api/auth/login','','POST',{email,password:'invalid'})).status,401);});
    await check("AUTH-03 protected page and API",async()=>{assert.equal((await request('/players')).status,307);assert.equal((await request('/api/players')).status,401);});
    await check("AUTH-04 admin creates hashed scout",async()=>{const r=await request('/api/admin/users',adminCookie,'POST',{fullName:'Integration Scout',email,password,role:'SCOUT'});assert.equal(r.status,201);const s=(await rows('SELECT * FROM `user` WHERE email=?',[email]))[0];scout=s.user_id;assert(s.password_hash!==password);assert(await bcrypt.compare(password,s.password_hash));scoutCookie=(await login(email,password)).cookie;});
    otherScout=await insert("INSERT INTO `user`(full_name,email,password_hash,role) VALUES ('Other Scout',?,?,'SCOUT')",[`other-${email}`,await bcrypt.hash(password,12)]);
    otherCookie=(await login(`other-${email}`,password)).cookie;
    await check("AUTH-05 scout denied admin operations",async()=>{for(const [path,method] of [['/api/admin/users','GET'],['/api/admin/users','POST'],['/api/admin/vectors','POST'],[`/api/players/${player}/vector`,'DELETE'],[`/api/players/${player}/contracts`,'POST'],[`/api/players/${player}/injuries`,'POST'],[`/api/players/${player}/transfers`,'POST'],[`/api/players/${player}/valuations`,'POST']])assert.equal((await request(path,scoutCookie,method,method==='POST'?{}:undefined)).status,403);});
    await check("DB-01 height constraint",()=>expectReject(()=>db.query('UPDATE player SET height_cm=100 WHERE player_id=?',[player]),['ER_CHECK_CONSTRAINT_VIOLATED']));
    await check("DB-02 appearances constraint",()=>expectReject(()=>db.query("INSERT INTO player_statistics(player_id,club_id,league_id,season,appearances,starts) VALUES (?,?,?,'2025-2026',1,2)",[player,club,league]),['ER_CHECK_CONSTRAINT_VIOLATED']));
    await check("DB-03 pass accuracy constraint",()=>expectReject(()=>db.query("INSERT INTO player_statistics(player_id,club_id,league_id,season,pass_accuracy) VALUES (?,?,?,'2025-2026',101)",[player,club,league]),['ER_CHECK_CONSTRAINT_VIOLATED']));
    await check("DB-04 injury dates",()=>expectReject(()=>db.query("INSERT INTO injury(player_id,injury_type,body_area,injury_date,expected_return_date,severity) VALUES (?,'Test','Leg','2026-09-10','2026-09-01','MINOR')",[player]),['ER_SIGNAL_EXCEPTION','ER_CHECK_CONSTRAINT_VIOLATED']));
    await check("DB-05 contract dates",()=>expectReject(()=>db.query("INSERT INTO contract(player_id,club_id,start_date,end_date) VALUES (?,?,'2026-09-10','2026-09-01')",[player,club]),['ER_SIGNAL_EXCEPTION','ER_CHECK_CONSTRAINT_VIOLATED']));
    await check("DB-06 negative contract salary",()=>expectReject(()=>db.query("INSERT INTO contract(player_id,club_id,start_date,end_date,weekly_salary) VALUES (?,?,'2026-01-01','2027-01-01',-1)",[player,club]),['ER_SIGNAL_EXCEPTION','ER_CHECK_CONSTRAINT_VIOLATED']));
    await check("DB-07 email unique",()=>expectReject(()=>db.query("INSERT INTO `user`(full_name,email,password_hash) VALUES ('Duplicate',?,'unused')",[email]),['ER_DUP_ENTRY']));
    await check("DB-09 referenced league restriction",()=>expectReject(()=>db.query('DELETE FROM league WHERE league_id=?',[league]),['ER_ROW_IS_REFERENCED_2']));
    await check("DB-10 cascade deletion",async()=>{await db.query("INSERT INTO injury(player_id,injury_type,body_area,injury_date,severity) VALUES (?,'Test','Leg','2026-01-01','MINOR')",[otherPlayer]);await db.query('DELETE FROM player WHERE player_id=?',[otherPlayer]);assert.equal((await rows('SELECT COUNT(*) n FROM injury WHERE player_id=?',[otherPlayer]))[0].n,0);});
    await check("CRUD-01 player list",async()=>{const r=await request('/api/players',scoutCookie);assert.equal(r.status,200);assert((await r.json()).players.length>=40);});
    await check("CRUD-02 combined filters",async()=>{const r=await request('/api/players?position=CM&ageMin=15&ageMax=50&minMinutes=1&maxMarketValue=999999999&availableOnly=true',scoutCookie);assert.equal(r.status,200);const data=await r.json();assert(data.players.length>0);for(const p of data.players){assert.equal(p.primary_position,'CM');assert.equal(p.availability,'AVAILABLE');}});
    await check("CRUD-03 player detail",async()=>{assert.equal((await request(`/api/players/${player}`,scoutCookie)).status,200);});
    await check("CRUD-04 admin writes",async()=>{for(const [path,body]of [
      ['injuries',{injury_type:'Test injury',body_area:'Leg',injury_date:'2026-01-01',severity:'MINOR'}],
      ['contracts',{club_id:club,start_date:'2026-01-01',end_date:'2028-01-01',weekly_salary:100}],
      ['valuations',{valuation_date:'2026-01-01',market_value:100000}],
      ['transfers',{from_club_id:null,to_club_id:club,transfer_date:'2026-01-02',transfer_type:'PERMANENT',transfer_fee:1000}]
    ] as const){const r=await request(`/api/players/${player}/${path}`,adminCookie,'POST',body);assert.equal(r.status,201,`${path}: ${await r.text()}`);}});
    await check("TX-05 failed contract replacement preserves active",async()=>{const before=(await rows("SELECT COUNT(*) n FROM contract WHERE player_id=? AND contract_status='ACTIVE'",[player]))[0].n;assert(before>0);const r=await request(`/api/players/${player}/contracts`,adminCookie,'POST',{club_id:club,start_date:'2028-01-01',end_date:'2027-01-01'});assert.equal(r.status,400);assert.equal((await rows("SELECT COUNT(*) n FROM contract WHERE player_id=? AND contract_status='ACTIVE'",[player]))[0].n,before);});
    await check("CRUD-05 scout recommendation",async()=>{const r=await request(`/api/players/${player}/reports`,scoutCookie,'POST',{overall_rating:8.5,recommendation:'SHORTLIST',strengths:'Fixture'});assert.equal(r.status,201);assert.equal((await rows('SELECT COUNT(*) n FROM scout_report WHERE scout_user_id=? AND player_id=?',[scout,player]))[0].n,1);assert.equal((await rows('SELECT COUNT(*) n FROM shortlist WHERE scout_user_id=? AND player_id=?',[scout,player]))[0].n,1);});
    const shortlistId=(await rows('SELECT shortlist_id FROM shortlist WHERE scout_user_id=? AND player_id=?',[scout,player]))[0]?.shortlist_id;
    await check("DB-08 shortlist unique",async()=>{assert.equal((await request('/api/shortlist',scoutCookie,'POST',{player_id:player})).status,409);});
    await check("CRUD-06 ownership and update",async()=>{assert.equal((await request(`/api/shortlist/${shortlistId}`,otherCookie,'PATCH',{priority:'HIGH'})).status,403);assert.equal((await request(`/api/shortlist/${shortlistId}`,scoutCookie,'PATCH',{priority:'HIGH',status:'CONTACT_CLUB',reason:'Integration'})).status,200);assert.equal((await rows('SELECT priority FROM shortlist WHERE shortlist_id=?',[shortlistId]))[0].priority,'HIGH');});
    await check("CRUD-07 ownership and delete",async()=>{assert.equal((await request(`/api/shortlist/${shortlistId}`,otherCookie,'DELETE')).status,403);assert.equal((await request(`/api/shortlist/${shortlistId}`,scoutCookie,'DELETE')).status,200);assert.equal((await rows('SELECT COUNT(*) n FROM shortlist WHERE shortlist_id=?',[shortlistId]))[0].n,0);});
    await check("CRUD-08 comparison",async()=>{const r=await request('/api/players/compare?ids=1,2',scoutCookie);assert.equal(r.status,200);assert.equal((await r.json()).players.length,2);});
    await check("CRUD-09 dashboard CTE ranking",async()=>{const r=await request('/api/dashboard',scoutCookie);assert.equal(r.status,200);assert((await r.json()).topTargets.length>0);});
    await check("TX-01 transfer commit",async()=>{await db.query("CALL sp_record_transfer(?,?,?,'2026-02-01',10,'EUR','PERMANENT','Test')",[player,club,club2]);assert.equal((await rows('SELECT club_id FROM player_club WHERE player_id=? AND is_current=TRUE',[player]))[0].club_id,club2);});
    await check("TX-02 transfer mid-operation rollback",async()=>{const before=(await rows('SELECT COUNT(*) n FROM transfer WHERE player_id=?',[player]))[0].n;await expectReject(()=>db.query("CALL sp_record_transfer(?,?,?,'2025-01-01',10,'EUR','PERMANENT','Rollback')",[player,club2,club]),['ER_CHECK_CONSTRAINT_VIOLATED']);assert.equal((await rows('SELECT COUNT(*) n FROM transfer WHERE player_id=?',[player]))[0].n,before);assert.equal((await rows('SELECT club_id FROM player_club WHERE player_id=? AND is_current=TRUE',[player]))[0].club_id,club2);});
    await check("TX-03 recommendation commit",async()=>{await db.query("CALL sp_add_scout_recommendation(?,?,9,NULL,NULL,NULL,'PRIORITY',NULL)",[scout,player]);assert.equal((await rows('SELECT priority FROM shortlist WHERE scout_user_id=? AND player_id=?',[scout,player]))[0].priority,'HIGH');});
    await check("TX-04 recommendation mid-operation rollback",async()=>{const before=(await rows('SELECT COUNT(*) n FROM scout_report WHERE scout_user_id=?',[scout]))[0].n;await db.query(`CREATE TRIGGER ${mysql.escapeId(trigger)} BEFORE INSERT ON shortlist FOR EACH ROW BEGIN IF NEW.scout_user_id=${Number(scout)} THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Integration rollback test'; END IF; END`);try{await expectReject(()=>db.query("CALL sp_add_scout_recommendation(?,?,9,NULL,NULL,NULL,'PRIORITY',NULL)",[scout,player]),['ER_SIGNAL_EXCEPTION']);assert.equal((await rows('SELECT COUNT(*) n FROM scout_report WHERE scout_user_id=?',[scout]))[0].n,before);}finally{await db.query(`DROP TRIGGER IF EXISTS ${mysql.escapeId(trigger)}`);}});
    await check("ADV-01 six views",async()=>{assert.equal((await rows("SELECT COUNT(*) n FROM information_schema.VIEWS WHERE TABLE_SCHEMA=DATABASE()"))[0].n,6);});
    await check("ADV-02 indexes",async()=>{assert((await rows("SHOW INDEX FROM player_statistics WHERE Key_name='idx_stats_player_season'")).length>0);});
    await check("ADV-03 four validation triggers",async()=>{assert.equal((await rows('SHOW TRIGGERS')).length,4);});
    await check("ADV-04 two stored procedures",async()=>{assert.equal((await rows("SELECT COUNT(*) n FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA=DATABASE() AND ROUTINE_TYPE='PROCEDURE'"))[0].n,2);});
    await check("ADV-05 scheduled event",async()=>{assert.equal((await rows('SHOW EVENTS'))[0].Status,'ENABLED');assert.equal((await rows("SHOW VARIABLES LIKE 'event_scheduler'"))[0].Value,'ON');});
    await check("ADV-06 explain indexed lookup",async()=>{const r=await rows("EXPLAIN SELECT * FROM player_statistics WHERE player_id=1 AND season='2025-2026'");assert(String(r[0].possible_keys).includes('idx_stats_player_season'));assert(r[0].key);});
    await check("RBAC-01 scout database denies users and core writes",async()=>{const conn=getPool('SCOUT');for(const sql of ["INSERT INTO `user`(full_name,email,password_hash) VALUES ('Denied','denied@example.test','unused')","UPDATE player SET first_name='Denied' WHERE player_id=0","SELECT password_hash FROM `user`","CREATE TABLE denied_ddl(id INT)"]){await expectReject(()=>conn.query(sql),['ER_TABLEACCESS_DENIED_ERROR','ER_COLUMNACCESS_DENIED_ERROR']);}const [r]=await conn.query<RowDataPacket[]>('SELECT CURRENT_ROLE() AS role');assert(String(r[0].role).includes('scoutiq_scout_role'));});
    await check("RBAC-02 admin database denies DDL",async()=>{await expectReject(()=>getPool('ADMIN').query('CREATE TABLE denied_admin_ddl(id INT)'),['ER_TABLEACCESS_DENIED_ERROR']);});
    await check("RBAC-03 authentication account is read only",async()=>{await expectReject(()=>getPool('AUTH').query('SELECT * FROM player'),['ER_TABLEACCESS_DENIED_ERROR']);});
    const client=getQdrantClient();
    await check("VEC-01 Qdrant connection",async()=>{await client.getCollections();});
    await check("VEC-02 vector rebuild",async()=>{const r=await rebuildPlayerVectors();assert(r.indexed>0);});
    await check("VEC-03 dimensions and metric",async()=>{const c=await client.getCollection(PLAYER_PROFILES_COLLECTION);const v=c.config.params.vectors;assert(v&&'size'in v);assert.equal(v.size,10);assert.equal(v.distance,'Cosine');});
    const points=await client.scroll(PLAYER_PROFILES_COLLECTION,{limit:1,with_payload:true});const target=Number(points.points[0].id);const position=points.points[0].payload?.primary_position;
    await check("VEC-04 neighbor retrieval excludes target",async()=>{const r=await request(`/api/players/${target}/similar`,scoutCookie);assert.equal(r.status,200);const data=await r.json();assert(data.similar.length>0);for(const p of data.similar)assert.notEqual(p.player_id,target);});
    await check("VEC-05 position filter",async()=>{const r=await request(`/api/players/${target}/similar?samePosition=true`,scoutCookie);assert.equal(r.status,200);const data=await r.json();assert(data.similar.length>0);for(const p of data.similar)assert.equal(p.primary_position,position);});
    await check("VEC-06 non-indexed player",async()=>{assert.equal((await request(`/api/players/${player}/similar`,scoutCookie)).status,404);});
    await check("VEC-07 delete and restore via API",async()=>{assert.equal((await request(`/api/players/${target}/vector`,adminCookie,'DELETE')).status,200);assert.equal((await request(`/api/players/${target}/similar`,scoutCookie)).status,404);assert.equal((await request('/api/admin/vectors',adminCookie,'POST')).status,200);assert.equal((await request(`/api/players/${target}/similar`,scoutCookie)).status,200);});
    await check("VEC-08 prune obsolete points",async()=>{await client.upsert(PLAYER_PROFILES_COLLECTION,{wait:true,points:[{id:2147483646,vector:Array.from({length:10},(_,i)=>i+1),payload:{season:'obsolete'}}]});assert((await rebuildPlayerVectors()).removed>=1);assert.equal((await client.retrieve(PLAYER_PROFILES_COLLECTION,{ids:[2147483646]})).length,0);});
    await check("VEC-09 combine multi-club statistics",async()=>{for(const clubId of [club,club2])await db.query("INSERT INTO player_statistics(player_id,club_id,league_id,season,minutes_played,goals,pass_accuracy) VALUES (?,?,?,'2025-2026',300,1,80)",[player,clubId,league]);const raw=(await buildRawFeatureVectors('2025-2026')).filter(p=>p.player_id===player);assert.equal(raw.length,1);assert(Math.abs(raw[0].goals_per_90-0.3)<1e-10);await db.query('DELETE FROM player_statistics WHERE player_id=?',[player]);});
    await check("VEC-10 invalid limits",async()=>{for(const limit of ['-1','0','NaN','1000'])assert.equal((await request(`/api/players/${target}/similar?limit=${limit}`,scoutCookie)).status,400);});
    await check("AUTH-06 logout invalidates browser cookie",async()=>{const r=await request('/api/auth/logout',scoutCookie,'POST');assert.equal(r.status,200);assert(/Max-Age=0|Expires=[^;]*1970/i.test(r.headers.get('set-cookie')??''));});
  } finally {
    await db.query(`DROP TRIGGER IF EXISTS ${mysql.escapeId(trigger)}`);
    if(player)await db.query('DELETE FROM player WHERE player_id=?',[player]);
    if(otherPlayer)await db.query('DELETE FROM player WHERE player_id=?',[otherPlayer]);
    for(const id of [scout,otherScout])if(id)await db.query('DELETE FROM `user` WHERE user_id=?',[id]);
    for(const id of [club,club2])if(id)await db.query('DELETE FROM club WHERE club_id=?',[id]);
    if(league)await db.query('DELETE FROM league WHERE league_id=?',[league]);
    await db.query(`DROP DATABASE IF EXISTS ${mysql.escapeId(schema)}`);
    await db.end();
    for(const role of ['SCOUT','ADMIN','AUTH'] as const)await getPool(role).end();
    fs.mkdirSync('docs/evidence',{recursive:true});
    fs.writeFileSync('docs/evidence/integration-results.json',JSON.stringify({date:'2026-11-18',baseUrl:base,results,passed:results.filter(r=>r.status==='PASS').length,failed:results.filter(r=>r.status==='FAIL').length},null,2));
  }
  const failed=results.filter(r=>r.status==='FAIL').length;console.log(`${results.length-failed}/${results.length} checks passed`);if(failed)process.exitCode=1;
}
main().catch(err=>{console.error('Integration harness failed:',err instanceof Error?err.message:'Unexpected error');process.exitCode=1;});

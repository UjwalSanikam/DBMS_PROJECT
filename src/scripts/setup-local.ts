import fs from "node:fs";
import path from "node:path";
import {randomBytes} from "node:crypto";
import {spawn, spawnSync, execFileSync} from "node:child_process";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

async function main() {
  if (process.platform!=="win32") throw new Error("For non-Windows setup, follow the manual MySQL and Docker Qdrant instructions in README.md.");
  const root=process.cwd();const runtime=path.join(root,'.runtime','mysql');
  fs.mkdirSync(runtime,{recursive:true});
  const envPath=path.join(root,'.env');
  let source=fs.readFileSync(fs.existsSync(envPath)?envPath:'.env.example','utf8');
  const values=dotenv.parse(source);
  if(!fs.existsSync(path.join(runtime,'original.env')) && fs.existsSync(envPath)) fs.copyFileSync(envPath,path.join(runtime,'original.env'));
  const fresh=!fs.existsSync(path.join(runtime,'data','mysql'));
  const generated: Record<string,string>={MYSQL_HOST:'127.0.0.1',MYSQL_PORT:'3307',MYSQL_DATABASE:'scoutiq',MYSQL_USER:'scoutiq_migrate',MYSQL_ROOT_USER:'root'};
  for(const role of ['ADMIN','SCOUT','AUTH'])generated[`MYSQL_${role}_USER`]=`scoutiq_${role.toLowerCase()}`;
  for(const key of ['MYSQL_PASSWORD','MYSQL_ROOT_PASSWORD','MYSQL_ADMIN_PASSWORD','MYSQL_SCOUT_PASSWORD','MYSQL_AUTH_PASSWORD','AUTH_SECRET','SEED_ADMIN_PASSWORD','SEED_SCOUT_PASSWORD']) {
    if(!values[key] || values[key].startsWith('replace_with')) generated[key]=randomBytes(24).toString('hex');
  }
  if(!values.SEED_ADMIN_EMAIL)generated.SEED_ADMIN_EMAIL='admin@scoutiq.local';
  if(!values.SEED_ADMIN_NAME)generated.SEED_ADMIN_NAME='ScoutIQ Admin';
  for(const [key,value]of Object.entries(generated)){
    const pattern=new RegExp('^'+key+'=.*$','m');source=pattern.test(source)?source.replace(pattern,`${key}=${value}`):source+`\n${key}=${value}`;
    values[key]=value;
  }
  fs.writeFileSync(envPath,source+'\n');Object.assign(process.env,values);
  const exe=process.env.MYSQLD_PATH??'C:/Program Files/MySQL/MySQL Server 8.0/bin/mysqld.exe';
  if(!fs.existsSync(exe))throw new Error('Install MySQL Server 8 or set MYSQLD_PATH to its mysqld.exe.');
  const data=path.join(runtime,'data');
  if(fresh){
    const result=spawnSync(exe,['--no-defaults','--initialize-insecure',`--datadir=${data}`],{windowsHide:true,encoding:'utf8'});
    if(result.status!==0)throw new Error('MySQL initialization failed. '+result.stderr);
  }
  async function connect(password=values.MYSQL_ROOT_PASSWORD){return mysql.createConnection({host:'127.0.0.1',port:3307,user:'root',password,connectTimeout:1500});}
  let conn;
  try {conn=await connect(fresh?'':undefined);} catch {
    const child=spawn(exe,['--no-defaults',`--datadir=${data}`,'--port=3307','--bind-address=127.0.0.1','--mysqlx=OFF','--event-scheduler=ON','--console'],{cwd:runtime,detached:true,windowsHide:true,stdio:['ignore',fs.openSync(path.join(runtime,'stdout.log'),'a'),fs.openSync(path.join(runtime,'stderr.log'),'a')]});
    child.unref();fs.writeFileSync(path.join(runtime,'process-id.txt'),String(child.pid));
    for(let i=0;i<30;i++){
      await new Promise(resolve=>setTimeout(resolve,500));
      try{conn=await connect(fresh?'':undefined);break;}catch{}
    }
  }
  if(!conn)throw new Error('Local MySQL did not start. Inspect .runtime/mysql/stderr.log.');
  if(fresh)await conn.query("ALTER USER 'root'@'localhost' IDENTIFIED BY "+mysql.escape(values.MYSQL_ROOT_PASSWORD));
  await conn.end();
  const qdrant=spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','scripts/start-qdrant.ps1'],{stdio:'inherit',windowsHide:true});
  if(qdrant.status!==0)throw new Error('Qdrant startup failed.');
  if(!process.argv.includes('--services-only')) {
    for(const script of ['provision-database.ts --create-only','migrate.ts','provision-database.ts','seed-admin.ts','seed-football.ts','seed-recruitment.ts','rebuild-vectors.ts']) {
      const [file,...args]=script.split(' ');
      execFileSync(process.execPath,['node_modules/tsx/dist/cli.mjs',`src/scripts/${file}`,...args],{stdio:'inherit',env:process.env,windowsHide:true});
    }
  }
  console.log('Local services ready: MySQL 127.0.0.1:3307 and Qdrant 127.0.0.1:6333. Credentials are in ignored .env.');
}
main().catch(err=>{console.error(err instanceof Error?err.message:'Local setup failed');process.exitCode=1;});

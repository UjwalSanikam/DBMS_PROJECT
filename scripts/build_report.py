from pathlib import Path
from html import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Preformatted, Image, PageBreak, KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from PIL import Image as PILImage

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output'
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='BodyReport', fontName='Helvetica', fontSize=10, leading=14, spaceAfter=8))
styles.add(ParagraphStyle(name='SmallReport', fontName='Helvetica', fontSize=8.3, leading=11, spaceAfter=5))
styles.add(ParagraphStyle(name='CodeReport', fontName='Courier', fontSize=8, leading=10, spaceAfter=9, backColor=colors.HexColor('#f1f4f7'), borderPadding=8))
styles['Title'].fontName='Helvetica-Bold'; styles['Title'].fontSize=26; styles['Title'].leading=31; styles['Title'].textColor=colors.black
styles['Heading1'].fontSize=17; styles['Heading1'].leading=22; styles['Heading1'].textColor=colors.HexColor('#173448')
styles['Heading2'].fontSize=12; styles['Heading2'].leading=16; styles['Heading2'].textColor=colors.HexColor('#173448')
story=[]; md=[]
def p(s,small=False):
    story.append(Paragraph(escape(s), styles['SmallReport' if small else 'BodyReport'])); md.append(s+'\n')
def h(s,level=1):
    story.append(Paragraph(escape(s),styles['Heading'+str(level)]));md.append('#'*(level+1)+' '+s+'\n')
def code(s,lang='sql'):
    story.append(Preformatted(s.strip(),styles['CodeReport']));md.append('```'+lang+'\n'+s.strip()+'\n```\n')
def table(headers,rows,widths):
    data=[[Paragraph(escape(str(x)),styles['SmallReport']) for x in row] for row in [headers]+rows]
    t=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e6edf2')),('VALIGN',(0,0),(-1,-1),'TOP'),('BOX',(0,0),(-1,-1),.5,colors.HexColor('#bccbd4')),('INNERGRID',(0,0),(-1,-1),.3,colors.HexColor('#d4dfe6')),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
    story.append(t);story.append(Spacer(1,9));md.append('| '+' | '.join(headers)+' |\n| '+' | '.join(['---']*len(headers))+' |\n'+'\n'.join('| '+' | '.join(str(v).replace('\n',' ') for v in r)+' |' for r in rows)+'\n')
def fig(name,caption,maxh=238):
    path=OUT/'report-assets'/name
    w,h0=PILImage.open(path).size; scale=min(487/w,maxh/h0)
    story.append(KeepTogether([Image(str(path),w*scale,h0*scale),Spacer(1,5),Paragraph(escape(caption),styles['SmallReport']),Spacer(1,9)]))
    md.append('!['+caption+'](report-assets/'+name+')\n')
def page():story.append(PageBreak());md.append('\n---\n')

story.append(Spacer(1,24))
story.append(Paragraph('ScoutIQ',styles['Title']))
story.append(Paragraph('Football Scouting and Recruitment Intelligence Platform',styles['Heading1']))
p('DBMS Project Report')
p('PES University | Department of Computer Science and Engineering')
p('Database Management Systems | Experiential Learning Level 3 | August to December 2026')
md.insert(0,'# ScoutIQ Football Scouting and Recruitment Intelligence Platform\n')
h('1 Title',2)
p('ScoutIQ - Football Scouting and Recruitment Intelligence Platform')
h('2 Students SRN and Name',2)
table(['Student name','SRN'],[['Ujwal Sanikam','PES1UG24CS506'],['Ved Mudkavi','PES1UG24CS522']],[244,243])
p('GitHub repository: https://github.com/UjwalSanikam/DBMS_PROJECT',True)
p('Review date: 18 November 2026. The GitHub repository was verified as public and accessible on the review date.',True)
h('3 Abstract',2)
p('ScoutIQ brings football recruitment records into a single database-driven application. Scouts can search players, examine seasonal performance and injury history, compare candidates, maintain shortlists, and review scouting assessments. Administrators manage application users. MySQL stores the relational records and supports constraints, joins, views, triggers, stored procedures, and transactional workflows. Qdrant provides a derived index of ten-dimensional player statistics for cosine similarity retrieval. Next.js integrates the interface and server-side APIs with both databases.')
p('The completed local demo integrates MySQL and Qdrant. All 52 integration checks pass, including role restrictions, constraints, transactional rollback and vector retrieval, update and deletion. The default production build uses webpack and passes. Section 9 maps the implementation and executed evidence to the supplied 50-mark rubric. The live viva and assessment of originality remain part of the evaluation.')

page();h('4 Tech Stack')
table(['Layer','Technology and purpose'],[
['Interface','Next.js 16.3.3 App Router, React 19.2.8, TypeScript 5 and Tailwind CSS 4'],
['Backend','Next.js Route Handlers; server modules for sessions, queries and player details'],
['Relational database','MySQL 8.0.46 verified locally; mysql2 ^3.24.2 client'],
['Vector database','Qdrant; @qdrant/js-client-rest ^1.20.0; player_profiles collection'],
['Authentication','bcryptjs ^3.0.3 password hashing; jose ^6.2.10 signed JWT cookies'],
['Validation and tooling','Zod ^4.4.3; ESLint 9; tsx; dotenv; CSV import tools']],[125,362])
h('Database choice and architecture',2)
p('MySQL fits connected player, club, league, contract and scouting data. Foreign keys preserve relationships, while transactional procedures keep transfer and recommendation updates atomic. Qdrant supports nearest-neighbor retrieval across playing-style features. It is a rebuildable search index; MySQL is the authoritative record store.')
code('Browser UI -> Next.js pages and Route Handlers\n                    | session and input validation\n                    +-> MySQL relational records and SQL analytics\n                    +-> Qdrant player_profiles similarity index','text')
h('Relational design',2)
p('The schema contains 12 domain tables and a schema_migrations ledger. League and club describe the competition structure; player_club records membership history. Statistics, injuries, contracts, transfers, valuations, reports and shortlist entries reference players. Scout reports and shortlists also reference user accounts.')
code('league 1 -- N club\nplayer 1 -- N player_club N -- 1 club\nplayer 1 -- N player_statistics N -- 1 club / league\nplayer 1 -- N injury / contract / transfer / market_value_history\nplayer 1 -- N scout_report N -- 1 user\nplayer 1 -- N shortlist    N -- 1 user','text')
p('Keys and constraints: each domain table has a primary key; child records use foreign keys. Email, seasonal statistics, dated valuations and per-scout shortlist membership have unique constraints. CHECK constraints validate numerical ranges and dates. A complete ER diagram is maintained in docs/ER_DIAGRAM.md and the relation definitions in docs/RELATIONAL_SCHEMA.md.',True)

page();h('4 Entity Relationship Diagram')
fig('ER_DIAGRAM.png','Entity relationship overview with primary and foreign keys',555)
p('Each arrow connects a parent to zero or more child records. Club references in transfer may be null; from_club_id and to_club_id are separate references. UK labels may form a composite key. The complete relation definitions and referential actions are supplied in docs/RELATIONAL_SCHEMA.md. The migrations are the executable design.',True)
p('Normalization separates identity from season and historical records. Derived age, latest valuation, availability and rank are computed in queries or views rather than stored redundantly. The Qdrant player ID is an application reference, not a cross-database foreign key.',True)
page();h('5 SQL Database Commands')
p('The canonical setup uses src/db/migrations, applied in filename order by src/scripts/migrate.ts. Nineteen migrations are recorded in the current database. The examples below are source excerpts or executable demonstration templates; parameter values must be supplied for the local demo.')
h('Database creation and migrations',2)
code('CREATE DATABASE IF NOT EXISTS scoutiq\n  CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;\nUSE scoutiq;\n-- From the terminal: npm run db:migrate')
h('DDL with keys and integrity constraints',2)
code('CREATE TABLE IF NOT EXISTS market_value_history (\n  valuation_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,\n  player_id INT UNSIGNED NOT NULL,\n  valuation_date DATE NOT NULL,\n  market_value DECIMAL(14,2) NOT NULL,\n  currency CHAR(3) NOT NULL DEFAULT \'EUR\',\n  source_label VARCHAR(80) NULL,\n  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  CONSTRAINT fk_valuation_player FOREIGN KEY (player_id)\n    REFERENCES player(player_id) ON DELETE CASCADE,\n  CONSTRAINT uq_valuation_player_date UNIQUE (player_id, valuation_date),\n  CONSTRAINT chk_valuation_value CHECK (market_value >= 0)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;')
p('This shortened table definition illustrates migration 007. The executable migration remains the authoritative source.',True)
code('CREATE INDEX idx_stats_player_season\n  ON player_statistics (player_id, season);\n-- Migration 016 also adds photo and crest URL columns.\n-- Migration 017 retires a trigger that modified its own table:\nDROP TRIGGER IF EXISTS trg_contract_single_active_after_insert;')
h('Inspect implemented objects',2)
code("SHOW FULL TABLES WHERE Table_type = 'VIEW';\nSHOW TRIGGERS;\nSHOW PROCEDURE STATUS WHERE Db = 'scoutiq';\nSHOW EVENTS FROM scoutiq;\nSHOW INDEX FROM player_statistics;\nSHOW VARIABLES LIKE 'event_scheduler';")
p('Observed: six views, four validation triggers, two procedures and ev_expire_contracts enabled with event_scheduler ON. Fresh-database creation and a repeat migration run both passed.',True)

page();h('5 SQL Operations and Advanced Queries')
h('DML operations',2)
p('Shortlist creation, update and deletion use parameterized SQL and the authenticated scout ID. The following are demonstration templates matching the application workflow, with ? values bound by mysql2.')
code("INSERT INTO shortlist\n  (scout_user_id, player_id, priority, status, reason)\nVALUES (?, ?, 'HIGH', 'RECOMMENDED', ?);\n\nSELECT * FROM shortlist WHERE scout_user_id = ?;\n\nUPDATE shortlist SET priority = ?, status = ?, reason = ?\nWHERE shortlist_id = ? AND scout_user_id = ?;\n\nDELETE FROM shortlist\nWHERE shortlist_id = ? AND scout_user_id = ?;")
h('Join and nested aggregate query',2)
code('SELECT mvh.player_id, mvh.market_value, mvh.valuation_date\nFROM market_value_history mvh\nINNER JOIN (\n  SELECT player_id, MAX(valuation_date) AS max_date\n  FROM market_value_history GROUP BY player_id\n) latest ON latest.player_id = mvh.player_id\n        AND latest.max_date = mvh.valuation_date;')
h('Correlated query',2)
code("SELECT p.player_id, p.first_name, p.last_name\nFROM player p\nWHERE NOT EXISTS (\n  SELECT 1 FROM injury i WHERE i.player_id = p.player_id\n  AND i.status IN ('ACTIVE', 'RECOVERING')\n);")
h('Advanced database concepts',2)
p('sp_record_transfer inserts the transfer, closes the current membership and opens the destination membership inside START TRANSACTION and COMMIT. An SQL exception handler executes ROLLBACK and RESIGNAL. sp_add_scout_recommendation inserts a report and conditionally upserts its shortlist entry atomically. Insert and update triggers validate injury dates and contract dates and amounts. Six views support recruitment analysis; an event expires past contracts daily.')
p('Migration 019 adds vw_ranked_scout_targets with a report_scores CTE and DENSE_RANK window function. The dashboard uses the resulting ranking. Both stored procedures passed deliberate mid-operation failure and rollback tests. Invalid dates, ranges, duplicate keys and foreign-key violations were rejected in the executed test suite.',True)

page();h('6 NoSQL and Vector Database Commands')
h('Player vector model',2)
p('The vector builder selects season 2025-2026 records with at least 450 minutes. Seventy-one players currently qualify in the reviewed local demo. It computes goals, assists, xG, xA, shots, key passes, progressive passes, tackles and interceptions per 90 minutes, plus pass accuracy. Each feature is standardized across the eligible pool as (value - mean) / standard deviation; a zero-variance feature becomes zero.')
p('Each Qdrant point uses the MySQL player ID and contains a ten-value vector plus player name, position, club and season payload. Cosine similarity ranks neighbors; same-position filtering is optional and the target is removed from the results. Displayed similarity rescales cosine scores to 0-100 and is not a calibrated probability.')
h('Implemented collection creation and point upsert',2)
code("await client.createCollection('player_profiles', {\n  vectors: { size: 10, distance: 'Cosine' }\n});\nawait client.upsert('player_profiles', { points });",'typescript')
h('Implemented retrieval and nearest-neighbor query',2)
code("const points = await client.retrieve('player_profiles', {\n  ids: [playerId], with_vector: true, with_payload: true\n});\nconst result = await client.query('player_profiles', {\n  query: target.vector as number[],\n  limit: limit + 1, filter, with_payload: true\n});",'typescript')
code("await client.delete('player_profiles', {\n  wait: true, points: [playerId]\n});",'typescript')
h('Setup and execution',2)
code('npm run services:start\n# Windows local services: MySQL 3307 and Qdrant 6333.\nnpm run rebuild-vectors\n# Open a profile, find similar players, then test Admin delete/refresh.','bash')
p('Upsert inserts new points or overwrites existing IDs. Administrators can delete a player vector using DELETE /api/players/[id]/vector, then refresh the index using POST /api/admin/vectors. Rebuilds aggregate each player across clubs, upsert the eligible IDs and delete obsolete stored IDs. Both administrator actions are available on the player profile. Tests verify deletion, restoration, stale cleanup and multi-club aggregation.',True)
p('Runtime verification on 18 November 2026: Qdrant 1.20.2 responds locally. The player_profiles collection uses size 10 and Cosine distance. Similar-player and same-position requests pass; the target is excluded. Below-threshold or deleted targets return 404, and malformed limits return 400. Rebuilding restores eligible deleted points.',True)

page();h('7 Next.js Project Tree Structure')
code('DBMS_PROJECT/\n|-- package.json / package-lock.json / next.config.ts\n|-- .env.example\n|-- scripts/                         report and startup tools\n|-- public/images/player-portraits.png\n|-- data-import/                     CSV import inputs\n|-- docs/                            design and demo documentation\n|-- src/\n|   |-- proxy.ts                     page authentication and roles\n|   |-- app/\n|   |   |-- layout.tsx / globals.css / page.tsx\n|   |   |-- login/                   sign-in page and form\n|   |   |-- (app)/\n|   |   |   |-- layout.tsx / app-nav.tsx / logout-button.tsx\n|   |   |   |-- dashboard/page.tsx\n|   |   |   |-- players/page.tsx / players-table.tsx\n|   |   |   |-- players/[id]/         profile and similarity UI\n|   |   |   |-- compare/page.tsx\n|   |   |   |-- shortlist/page.tsx / reports/page.tsx\n|   |   |   `-- admin/users/          account administration\n|   |   `-- api/\n|   |       |-- auth/login / logout / me\n|   |       |-- admin/users / admin/vectors / dashboard / reports\n|   |       |-- players/route.ts / players/compare/route.ts\n|   |       |-- players/[id]/route.ts\n|   |       |-- players/[id]/contracts / injuries / reports\n|   |       |-- players/[id]/similar / vector / transfers / valuations\n|   |       `-- shortlist/route.ts / shortlist/[id]/route.ts\n|   |-- components/                  brand and player avatar\n|   |-- lib/\n|   |   |-- auth.ts / session.ts / db.ts / qdrant.ts\n|   |   `-- dashboard.ts / player-detail.ts / similarity.ts / vector-index.ts\n|   |-- db/migrations/               001 through 019 SQL files\n|   `-- scripts/\n|       |-- migrate.ts / seed-admin.ts / seed-football.ts\n|       |-- seed-recruitment.ts / import-transfermarkt.ts\n|       |-- setup-local.ts / provision-database.ts / test-integration.ts\n|       `-- rebuild-vectors.ts\n`-- output/                          generated submission report','text')
p('The tree condenses repeated route.ts leaves for readability. Database access is server-side. Page protection is in src/proxy.ts; APIs independently call requireSession and validate inputs. Migrations under src/db/migrations are canonical. Root SQL dumps and the separate db/migrations copy are reference artifacts and must not replace the documented migration path.',True)

page();h('8 Sample Screenshots of Application and Code')
p('The following application captures were taken from the local webpack development server on 18 November 2026 using the configured demonstration account. They show the current MySQL-backed demo.')
fig('01-login.png','Figure 1  Login page',245)
fig('02-dashboard.png','Figure 2  Recruitment dashboard with 80 players and scouting summaries',285)

page();h('8 Player Search and Detail Screenshots')
fig('03-player-search.png','Figure 3  Searchable player database',285)
fig('04-player-detail.png','Figure 4  Player profile with performance and valuation history',285)

page();h('8 Comparison and Vector Code Screenshots')
fig('05-player-comparison.png','Figure 5  Comparison populated with two selected players',305)
fig('13-code-vector.png','Figure 6  Source excerpt from src/lib/qdrant.ts showing collection configuration',240)
p('Code screenshots render the actual source excerpt with line numbers. Live vector results and delete controls are shown on the following page.',True)

page();h('8 Live Vector Demonstration')
fig('06-similar-players.png','Figure 8  Live cosine similarity results with the target excluded',260)
fig('06b-position-filter.png','Figure 9  Same-position filtering applied to the player results',210)
fig('06c-vector-deleted.png','Figure 10  Administrator deletes the vector and can restore it through refresh',130)
p('The vector deletion and restore flow was executed successfully. The automated suite also checks that retrieval returns 404 after deletion and succeeds again after refresh.',True)
page();h('8 SQL Code and Verification Evidence')
fig('12-code-sql.png','Figure 7  SQL keys, CHECK constraints and indexes in migration 003',270)
table(['Executed check','Observed result'],[
['npm run lint','PASS - exit code 0'],
['npx tsc --noEmit','PASS - exit code 0'],
['npm run build','PASS - webpack is now the default build configuration'],
['npx next build --webpack','PASS - optimized build and route generation completed'],
['MySQL read-only inspection','PASS - 13 tables including ledger; 6 views; 4 triggers; 2 procedures; event enabled'],
['Authentication and APIs','PASS - anonymous player API 401; invalid login 401; admin login 200; comparison API 200'],
['Browser demo','PASS - login, dashboard, player search, detail and two-player comparison observed'],
['Qdrant connectivity','PASS - collection, size 10, Cosine metric and live retrieval verified']],[166,321])
p('The integration harness passes 52 of 52 checks. It verifies fresh/repeated migrations, role-denial tests, SQL and API writes, invalid inputs, ownership restrictions, deliberate mid-operation rollback, vector retrieval/deletion/restoration, stale cleanup and multi-club statistics. Disposable fixtures and the temporary verification schema are removed in cleanup. Complete results are in docs/TESTING.md and docs/evidence/integration-results.json.',True)

page();h('9 Evaluation Rubrics Completion Status')
p('The supplied DBMS Level 3 PDF assigns 50 marks across the following 14 components. Status describes implementation and observed evidence; it is not an awarded or predicted mark. Parenthetical concept lists in the rubric may need instructor interpretation.')
rubric=[
['1','ER diagram','2','Documented','Rendered ER diagram included; editable SVG, DOT and detailed Mermaid source supplied.'],
['2','Relational schema with keys, relationships and constraints','3','Documented','Schema, keys, referential actions and constraints documented; live negative tests passed.'],
['3','SQL DDL with constraints','4','Implemented','19 migrations apply on a fresh schema and skip on repeat. Constraints verified.'],
['4','NoSQL or vector database creation','4','Verified','Live Qdrant collection verified with 71 eligible player vectors.'],
['5','Technology justification','1','Documented','MySQL for integrity and transactions; Qdrant for numeric similarity retrieval.'],
['6','DML operations','4','Implemented','API and SQL create/read/update/delete checks pass using disposable fixtures.'],
['7','Nested or correlated or recursive queries and joins','4','Implemented','Joins, nested aggregation and NOT EXISTS present. No recursive query found.'],
['8','Advanced SQL concepts such as procedure, function, trigger, CTE','6','Verified','Two procedures, four triggers, CTE/window ranking, views, indexes and event verified.'],
['9','NoSQL or vector feature and RUD','7','Verified','Retrieve/query/upsert/delete, position filter, stale cleanup and restore all pass.'],
['10','Next.js interface','3','Observed','Working login, dashboard, player pages and comparison screenshots.'],
['11','Backend or API database integration','2','Verified','MySQL and Qdrant APIs both execute successfully; browser demo captured.'],
['12','Authentication and minimum two roles with database RBAC','4','Verified','ADMIN/SCOUT sessions plus separate MySQL ADMIN/SCOUT/AUTH roles. Denied operations tested.'],
['13','Documentation and Git or GitHub','2','Documented','Report, diagram, screenshots, executed tests and public GitHub link supplied.'],
['14','Originality, individual contribution, modification and viva','4','Team evidence needed','Requested 50/50 responsibility allocation documented. Live modification and viva remain student tasks.'],
]
table(['No','Evaluation component','Max','Completion and evidence'],[[r[0],r[1],r[2],r[3]+' - '+r[4]] for r in rubric],[27,150,30,280])
p('Total maximum marks: 50. A precise score requires the evaluator to assess correct execution and the viva.',True)

page();h('9 Submission Readiness and Team Allocation')
h('Technical readiness',2)
p('The technical deliverables are prepared: the Next.js application, relational and vector databases, restricted runtime accounts, advanced SQL, migration scripts, setup tooling, executed test evidence, screenshots and this report. The default build passes; all 52 integration checks pass. A clean npm installation and production build are checked separately.')
p('Local setup uses an isolated MySQL 8.0.46 process on port 3307 and Qdrant 1.20.2 on port 6333. Existing MySQL data on port 3306 is preserved. Start the prepared services with npm run services:start, then launch npm run dev. On another Windows machine with MySQL installed, run npm ci followed by npm run setup:local. Manual setup is documented for other platforms.')
h('Equal responsibility allocation',2)
table(['Student and SRN','Allocated responsibility'],[
['Ujwal Sanikam\nPES1UG24CS506','50% - relational design, migrations, advanced SQL, integrity constraints, transactional workflows and database access'],
['Ved Mudkavi\nPES1UG24CS522','50% - Next.js interface, API integration, vector workflows, test execution and report assembly']],[180,307])
p('This is the team requested responsibility allocation. It is not an independently verified history of authorship. Both students should be able to explain and modify their assigned parts during evaluation.',True)
h('Final student actions',2)
p('Rehearse the live demo using docs/DEMO_GUIDE.md. Confirm the title is unique within the section and be ready to explain original design decisions, the equal allocation and any assistance used. Check the submitted GitHub revision matches the source package. These human assessment steps cannot be completed by an automated test or assigned an automatic mark.')
h('Submission topic coverage',2)
p('All nine requested topics are included: title; student SRNs and names; abstract; tech stack; SQL commands; vector commands; Next.js tree; application and code screenshots; and evaluation rubric completion. The supplied rubric has 14 components totaling 50 marks. Implementation evidence is separate from the evaluator\'s awarded score.')
h('References',2)
p('DBMS Level 3.pdf, page 1, evaluation tables. Canonical source: src/db/migrations/001-019; src/lib/db.ts, qdrant.ts, vector-index.ts and similarity.ts; src/scripts/provision-database.ts, setup-local.ts and test-integration.ts; src/app/api. Evidence: docs/TESTING.md and docs/evidence/integration-results.json. Official vector API reference: https://qdrant.tech/documentation/manage-data/points/. Public repository: https://github.com/UjwalSanikam/DBMS_PROJECT.',True)

def footer(canvas,doc):
    canvas.setFont('Helvetica',8);canvas.setFillColor(colors.HexColor('#526572'))
    canvas.drawString(54,28,'ScoutIQ  |  DBMS Level 3  |  18 November 2026')
    canvas.drawRightString(A4[0]-54,28,str(doc.page))
doc=SimpleDocTemplate(str(OUT/'pdf'/'ScoutIQ_DBMS_Project_Report.pdf'),pagesize=A4,rightMargin=54,leftMargin=54,topMargin=44,bottomMargin=47,title='ScoutIQ DBMS Project Report',author='Ujwal Sanikam and Ved Mudkavi')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
(OUT/'ScoutIQ_DBMS_Project_Report.md').write_text('\n'.join(md),encoding='utf-8')
(ROOT/'docs'/'PROJECT_REPORT.md').write_text('\n'.join(md).replace('report-assets/', 'screenshots/'),encoding='utf-8')
print('Created PDF and editable Markdown report')

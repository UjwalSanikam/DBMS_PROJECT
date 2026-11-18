"""Build and verify the source/report submission without local secrets or runtimes."""
from pathlib import Path
import hashlib
import json
import re
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'output' / 'submission'
DEST.mkdir(parents=True, exist_ok=True)
files = set()
for directory in ['src', 'public', 'docs', 'scripts', 'output/report-assets']:
    files.update(p for p in (ROOT / directory).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
for name in ['.env.example', '.gitignore', '.gitattributes', 'AGENTS.md', 'README.md', 'package.json', 'package-lock.json', 'next.config.ts', 'tsconfig.json', 'eslint.config.mjs', 'postcss.config.mjs', 'DBMS Level 3.pdf', 'data-import/competitions.csv', 'data-import/clubs_filtered.csv', 'data-import/players_filtered.csv', 'output/pdf/ScoutIQ_DBMS_Project_Report.pdf', 'output/ScoutIQ_DBMS_Project_Report.md']:
    files.add(ROOT / name)
secrets = []
for line in (ROOT / '.env').read_text().splitlines():
    if '=' not in line or line.lstrip().startswith('#'):
        continue
    key, value = line.split('=', 1)
    value = value.strip().strip('"').strip("'")
    if re.search(r'PASSWORD|SECRET|API_KEY', key) and len(value) >= 12 and not value.startswith('replace_with'):
        secrets.append(value.encode())
manifest = {}
for path in sorted(files):
    data = path.read_bytes()
    if any(secret in data for secret in secrets):
        raise RuntimeError(f'Local credential found in submission candidate: {path.relative_to(ROOT)}')
    manifest[path.relative_to(ROOT).as_posix()] = hashlib.sha256(data).hexdigest()
archive = DEST / 'ScoutIQ_Submission.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for path in sorted(files):
        z.write(path, 'ScoutIQ/' + path.relative_to(ROOT).as_posix())
    z.writestr('ScoutIQ/SUBMISSION_MANIFEST.json', json.dumps(manifest, indent=2))
with zipfile.ZipFile(archive) as z:
    for name, checksum in manifest.items():
        assert hashlib.sha256(z.read('ScoutIQ/' + name)).hexdigest() == checksum
    assert not any('/.env' in n and not n.endswith('/.env.example') for n in z.namelist())
    assert not any('/node_modules/' in n or '/.runtime/' in n or '/.next/' in n for n in z.namelist())
    assert 'ScoutIQ/src/proxy.ts' in z.namelist()
    assert 'ScoutIQ/src/middleware.ts' not in z.namelist()
print(f'Created and verified {archive.name}: {len(files)} files plus a SHA-256 manifest, {archive.stat().st_size:,} bytes.')

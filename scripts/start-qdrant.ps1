$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$runtime = Join-Path $root '.runtime/qdrant'
New-Item -ItemType Directory -Force $runtime | Out-Null
try {
    $health = Invoke-RestMethod 'http://127.0.0.1:6333/healthz' -TimeoutSec 2
    Write-Output "Qdrant is already listening on port 6333."
    exit 0
} catch {}
$exe = Join-Path $runtime 'qdrant.exe'
if (-not (Test-Path -LiteralPath $exe)) {
    $url = 'https://github.com/qdrant/qdrant/releases/download/v1.20.2/qdrant-x86_64-pc-windows-msvc.zip'
    $archive = Join-Path $runtime 'qdrant.zip'
    Invoke-WebRequest $url -OutFile $archive
    Expand-Archive -LiteralPath $archive -DestinationPath $runtime -Force
}
$config = Join-Path $runtime 'local.yaml'
@'
storage:
  storage_path: ./storage
service:
  host: 127.0.0.1
  http_port: 6333
  grpc_port: 6334
telemetry_disabled: true
'@ | Set-Content -LiteralPath $config
$proc = Start-Process -FilePath $exe -ArgumentList @('--config-path', $config) -WorkingDirectory $runtime -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtime 'stdout.log') -RedirectStandardError (Join-Path $runtime 'stderr.log') -PassThru
$proc.Id | Set-Content (Join-Path $runtime 'process-id.txt')
for ($attempt=0; $attempt -lt 30; $attempt++) {
    Start-Sleep -Milliseconds 500
    try {
        Invoke-RestMethod 'http://127.0.0.1:6333/healthz' -TimeoutSec 2 | Out-Null
        Write-Output "Qdrant ready at http://127.0.0.1:6333 (PID $($proc.Id))."
        exit 0
    } catch {}
}
throw "Qdrant did not become ready. Inspect .runtime/qdrant/stderr.log."

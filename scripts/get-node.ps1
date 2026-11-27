# Downloads a private copy of Node.js (LTS) into <project>\.runtime\node.
# Used by RUN_RIDEWAVE.bat and RIDEWAVE_TOOLS.bat when the computer has no Node.js.
# No admin rights needed and nothing is installed system wide: delete .runtime to remove it.
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}

$root = Split-Path -Parent $PSScriptRoot
$runtime = Join-Path $root '.runtime'
$dest = Join-Path $runtime 'node'
if (Test-Path (Join-Path $dest 'node.exe')) { Write-Host 'Node.js is already in .runtime\node'; exit 0 }
New-Item -ItemType Directory -Force -Path $runtime | Out-Null

try {
  $index = Invoke-RestMethod -Uri 'https://nodejs.org/dist/index.json' -UseBasicParsing
  # Node 22 LTS (Vite 8 needs 20.19+ or 22.12+); fall back to the newest LTS
  $pick = $index | Where-Object { $_.lts -and $_.version -like 'v22.*' } | Select-Object -First 1
  if (-not $pick) { $pick = $index | Where-Object { $_.lts } | Select-Object -First 1 }
  $version = $pick.version

  $arch = 'x64'
  if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64' -or $env:PROCESSOR_ARCHITEW6432 -eq 'ARM64') { $arch = 'arm64' }
  elseif (-not [Environment]::Is64BitOperatingSystem) { $arch = 'x86' }

  $name = "node-$version-win-$arch"
  $zip = Join-Path $runtime "$name.zip"
  Write-Host "Downloading Node.js $version ($arch)..."
  Invoke-WebRequest -Uri "https://nodejs.org/dist/$version/$name.zip" -OutFile $zip -UseBasicParsing

  Write-Host 'Unpacking...'
  Expand-Archive -Path $zip -DestinationPath $runtime -Force
  if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
  Rename-Item -Path (Join-Path $runtime $name) -NewName 'node'
  Remove-Item $zip -Force
  Write-Host "Node.js $version is ready in .runtime\node"
  exit 0
} catch {
  Write-Host "Download failed: $($_.Exception.Message)"
  exit 1
}

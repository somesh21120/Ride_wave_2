# Makes RideWave-share-<date>.zip next to the project folder, for a teammate.
# Leaves out everything that is big, personal or rebuilt automatically:
#   node_modules, .git, backend\.localdb (your data), logs, caches, builds, .runtime (private Node.js)
# backend\.env is left out unless -IncludeEnv is given.
# The receiver unzips it and double-clicks RUN_RIDEWAVE.bat; Node.js and packages install by themselves.
param([switch]$IncludeEnv)
$ErrorActionPreference = 'Stop'

$root = (Resolve-Path (Split-Path -Parent $PSScriptRoot)).Path.TrimEnd('\')
$stamp = Get-Date -Format 'yyyy-MM-dd'
$dest = Join-Path (Split-Path -Parent $root) "RideWave-share-$stamp.zip"

$skipDirs  = @('node_modules', '.git', '.localdb', '.cache', '.runtime', 'dist', '.vite')
$skipPaths = @('backend\logs')
$skipFiles = @('backend\.env.backup', 'backend\.env.tmp')
if (-not $IncludeEnv) { $skipFiles += 'backend\.env' }

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
if (Test-Path $dest) { Remove-Item $dest -Force }
$zip = [System.IO.Compression.ZipFile]::Open($dest, 'Create')
$script:count = 0

function Add-Folder([string]$dir) {
  foreach ($item in Get-ChildItem -LiteralPath $dir -Force) {
    if ($item.PSIsContainer) {
      $relDir = $item.FullName.Substring($root.Length + 1)
      if ($skipDirs -notcontains $item.Name -and $skipPaths -notcontains $relDir) { Add-Folder $item.FullName }
      continue
    }
    $rel = $item.FullName.Substring($root.Length + 1)
    if ($skipFiles -contains $rel) { continue }
    if ($item.Name -like '*.log') { continue }
    $entry = 'ridewave-app/' + ($rel -replace '\\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $item.FullName, $entry, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
    $script:count++
  }
}

try {
  Write-Host 'Packing the project...'
  Add-Folder $root
} finally {
  $zip.Dispose()
}

$mb = [math]::Round((Get-Item $dest).Length / 1MB, 1)
Write-Host ''
Write-Host "Done: $($script:count) files, $mb MB"
Write-Host "Saved as: $dest"
if ($IncludeEnv) { Write-Host 'Your backend\.env settings ARE inside. Share it only with the team.' }
else { Write-Host 'backend\.env is NOT inside; the receiver gets the default settings automatically.' }
Start-Process explorer.exe -ArgumentList "/select,`"$dest`""

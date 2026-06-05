# Tasify Native Host — Windows Installation Script
# Run this script as Administrator to register the Native Messaging Host.

param(
  [Parameter(Mandatory = $false)]
  [string]$HostDir = "",
  [Parameter(Mandatory = $false)]
  [string]$ExtensionId = "",
  [switch]$Uninstall
)

$ErrorActionPreference = "Stop"

$HOST_NAME = "com.tasify.claude.host"
$MANIFEST_FILE = "manifest.json"

# Resolve paths
if (-not $HostDir) {
  $HostDir = Split-Path -Parent $PSScriptRoot
}
$HostDir = Resolve-Path $HostDir

$manifestPath = Join-Path $HostDir $MANIFEST_FILE
$hostEntryPoint = Join-Path $HostDir "src\index.js"

if (-not (Test-Path $manifestPath)) {
  Write-Error "manifest.json not found at: $manifestPath"
  exit 1
}

if (-not (Test-Path $hostEntryPoint)) {
  Write-Error "Host entry point not found at: $hostEntryPoint"
  exit 1
}

function Install-Host {
  Write-Host "=== Tasify Native Host Installation ===" -ForegroundColor Cyan
  Write-Host "Host directory: $HostDir"
  Write-Host ""

  # 1. Prepare manifest with absolute path and optionally extension ID
  $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
  $manifest.path = $hostEntryPoint

  if ($ExtensionId) {
    $manifest.allowed_origins = @("chrome-extension://$ExtensionId/")
  }

  $finalManifest = $manifest | ConvertTo-Json -Depth 4

  # 2. Write manifest to a location Chrome can find
  $manifestDest = Join-Path $HostDir "com.tasify.claude.host.json"
  $finalManifest | Set-Content -Path $manifestDest -Encoding UTF8 -Force
  Write-Host "Manifest written to: $manifestDest" -ForegroundColor Green
  Write-Host "  $finalManifest"

  # 3. Register in Windows Registry
  $regPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$HOST_NAME"
  if (-not (Test-Path $regPath)) {
    New-Item -Path $regPath -Force | Out-Null
  }
  Set-ItemProperty -Path $regPath -Name "(default)" -Value $manifestDest
  Write-Host "Registry key created: $regPath -> $manifestDest" -ForegroundColor Green

  Write-Host ""
  Write-Host "Installation complete! Chrome will find the Tasify Native Host." -ForegroundColor Green
  Write-Host "To test: start the host manually with 'node src/index.js' from the host directory," -ForegroundColor Yellow
  Write-Host "then trigger a hook with: curl -X POST http://localhost:3000/hooks ..." -ForegroundColor Yellow
}

function Uninstall-Host {
  Write-Host "=== Tasify Native Host Uninstall ===" -ForegroundColor Yellow

  $regPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$HOST_NAME"
  if (Test-Path $regPath) {
    Remove-Item -Path $regPath -Force
    Write-Host "Registry key removed: $regPath" -ForegroundColor Green
  } else {
    Write-Host "Registry key not found." -ForegroundColor Gray
  }

  $manifestDest = Join-Path $HostDir "com.tasify.claude.host.json"
  if (Test-Path $manifestDest) {
    Remove-Item -Path $manifestDest -Force
    Write-Host "Manifest file removed: $manifestDest" -ForegroundColor Green
  }

  Write-Host "Uninstall complete." -ForegroundColor Green
}

# ── Main ──

if ($Uninstall) {
  Uninstall-Host
} else {
  Install-Host
}
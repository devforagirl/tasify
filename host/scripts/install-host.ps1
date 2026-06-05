# Tasify Native Host — Windows Installation Script

param(
  [string]$HostDir = "",
  [string]$ExtensionId = "",
  [switch]$Uninstall
)

$ErrorActionPreference = "Stop"
$HOST_NAME = "com.tasify.claude.host"

if (-not $HostDir) { $HostDir = Split-Path -Parent $PSScriptRoot }
$HostDir = Resolve-Path $HostDir

function Install-Host {
  Write-Host "=== Tasify Native Host Installation ===" -ForegroundColor Cyan
  Write-Host "Host directory: $HostDir`n"

  $launcherPath = (Join-Path $HostDir "scripts\run-host.bat") -replace '\\', '\\'
  $manifestDest = Join-Path $HostDir "com.tasify.claude.host.json"

  $extId = if ($ExtensionId) { $ExtensionId } else { "PLACEHOLDER" }

  # Build JSON manually to avoid ConvertTo-Json single-element array bug in PS 5.1
  $json = @"
{
  "name": "com.tasify.claude.host",
  "description": "Tasify Claude Code Bridge",
  "path": "$launcherPath",
  "type": "stdio",
  "allowed_origins": ["chrome-extension://$extId/"]
}
"@
  $json | Set-Content $manifestDest -Encoding UTF8 -Force

  Write-Host "Manifest written to: $manifestDest"
  Write-Host "  Launcher: $launcherPath"
  Write-Host "  Allowed origins: chrome-extension://$extId/"

  $regPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$HOST_NAME"
  if (-not (Test-Path $regPath)) { New-Item -Path $regPath -Force | Out-Null }
  Set-ItemProperty -Path $regPath -Name "(default)" -Value $manifestDest
  Write-Host "Registry key: $regPath"
  Write-Host ""
  Write-Host "Installation complete!" -ForegroundColor Green
}

function Uninstall-Host {
  Write-Host "=== Tasify Native Host Uninstall ===" -ForegroundColor Yellow
  $regPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$HOST_NAME"
  if (Test-Path $regPath) { Remove-Item -Path $regPath -Force; Write-Host "Registry removed" }
  $manifestDest = Join-Path $HostDir "com.tasify.claude.host.json"
  if (Test-Path $manifestDest) { Remove-Item $manifestDest -Force; Write-Host "Manifest removed" }
  Write-Host "Uninstall complete." -ForegroundColor Green
}

if ($Uninstall) { Uninstall-Host } else { Install-Host }

# Tasify Native Host — Uninstall Script
param(
  [Parameter(Mandatory = $false)]
  [string]$HostDir = ""
)

$ErrorActionPreference = "Stop"

$HOST_NAME = "com.tasify.claude.host"

if (-not $HostDir) {
  $HostDir = Split-Path -Parent $PSScriptRoot
}
$HostDir = Resolve-Path $HostDir

$regPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$HOST_NAME"
if (Test-Path $regPath) {
  Remove-Item -Path $regPath -Force
  Write-Host "Removed registry key: $regPath" -ForegroundColor Green
}

$manifestDest = Join-Path $HostDir "com.tasify.claude.host.json"
if (Test-Path $manifestDest) {
  Remove-Item -Path $manifestDest -Force
  Write-Host "Removed manifest: $manifestDest" -ForegroundColor Green
}

Write-Host "Tasify Native Host uninstalled successfully." -ForegroundColor Green
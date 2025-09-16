param(
  [switch]$Sign
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path "$PSScriptRoot\..\.."
$frontendDir = Join-Path $repoRoot 'frontend'
$backendRoot = Resolve-Path "$PSScriptRoot\.."

# Build the Vue/React frontend before bundling it into the backend assets
Push-Location $frontendDir
if (-not (Test-Path 'node_modules')) {
  npm ci
}
npm run build
Pop-Location

# Copy the compiled frontend into the backend static directory that PyInstaller will consume
$backendStatic = Join-Path $backendRoot 'app\static\frontend'
if (Test-Path $backendStatic) {
  Remove-Item -Recurse -Force $backendStatic
}
New-Item -ItemType Directory -Force -Path $backendStatic | Out-Null
Copy-Item -Recurse (Join-Path $frontendDir 'dist\*') $backendStatic

Push-Location $backendRoot
python -m pip install --upgrade pip
python -m pip install --upgrade pyinstaller passlib bcrypt uvicorn fastapi "sqlalchemy<2.1" pydantic pydantic-settings

# Ensure we start from a clean PyInstaller output directory for reproducible hashes
Remove-Item -Recurse -Force 'build' -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force 'dist' -ErrorAction SilentlyContinue

python -m PyInstaller --noconfirm --clean pyinstaller_riskworks.spec
Pop-Location

$exePath = Join-Path $backendRoot 'dist\RiskWorks.exe'

if ($Sign) {
  $signtool = Get-Command 'signtool.exe' -ErrorAction SilentlyContinue
  if (-not $signtool) {
    throw 'signtool.exe was not found in PATH. Install Windows SDK or adjust PATH.'
  }

  $certPath = $env:CODE_SIGN_CERT_PATH
  if (-not $certPath) {
    throw 'Set CODE_SIGN_CERT_PATH to the PFX/PKCS12 certificate you want to sign with.'
  }

  $timestamp = if ($env:CODE_SIGN_TIMESTAMP_URL) { $env:CODE_SIGN_TIMESTAMP_URL } else { 'http://timestamp.digicert.com' }
  $args = @('sign', '/fd', 'SHA256', '/f', $certPath, '/tr', $timestamp, '/td', 'SHA256')
  if ($env:CODE_SIGN_CERT_PASSWORD) {
    $args += '/p'
    $args += $env:CODE_SIGN_CERT_PASSWORD
  }

  Write-Host "Signing $exePath with certificate $certPath"
  & $signtool.Source @args $exePath
}

Write-Host "Build complete: $exePath"
if (-not $Sign) {
  Write-Host 'Tip: re-run with -Sign (and CODE_SIGN_CERT_PATH/CODE_SIGN_CERT_PASSWORD) to Authenticode sign the binary for better SmartScreen reputation.'
}

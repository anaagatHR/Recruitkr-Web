# Reliable production build for when this repo lives inside OneDrive.
#
# Why: OneDrive continuously syncs files under the project. During `next build`
# it locks/moves freshly-written `.next` chunks, producing NON-DETERMINISTIC
# "Cannot find module" / prerender errors (a different missing module each run).
# The code is fine — the build just needs a working tree OneDrive isn't touching.
#
# What this does: copies the source (NOT node_modules/.next/.git) to a temp dir
# outside OneDrive, junctions node_modules in, and runs `next build` there. A
# green run here proves the build is healthy. Deployment platforms (e.g. Vercel)
# build outside OneDrive already, so they are unaffected by the local issue.
#
# Usage:  powershell -ExecutionPolicy Bypass -File scripts/build-clean.ps1

$ErrorActionPreference = "Stop"
$src = Split-Path -Parent $PSScriptRoot
$work = Join-Path $env:TEMP "rkr-build"

Write-Host "Source : $src"
Write-Host "Build  : $work"

if (Test-Path "$work\node_modules") { cmd /c rmdir "$work\node_modules" | Out-Null }
if (Test-Path $work) { Remove-Item -Recurse -Force $work }
New-Item -ItemType Directory -Force $work | Out-Null

Write-Host "Copying source (excluding node_modules/.next/.git)..."
robocopy $src $work /E /XD node_modules .next .git /NFL /NDL /NJH /NJS /NC /NS | Out-Null

Write-Host "Linking node_modules..."
cmd /c mklink /J "$work\node_modules" "$src\node_modules" | Out-Null

Push-Location $work
try {
  # Next prints a `sharp` recommendation to stderr; under ErrorActionPreference
  # = Stop that would abort the script even on a successful build. Relax it here
  # and trust the process exit code instead.
  $ErrorActionPreference = "Continue"
  $env:NODE_ENV = "production"
  # Invoke the Next binary directly via node — `npx next` can fail to resolve
  # the executable through the junctioned node_modules in this nested shell.
  & node "$work\node_modules\next\dist\bin\next" build
  $code = $LASTEXITCODE
} finally {
  Pop-Location
}

if ($code -eq 0) { Write-Host "`nBuild OK (output: $work\.next)" -ForegroundColor Green }
else { Write-Host "`nBuild FAILED (exit $code)" -ForegroundColor Red }
exit $code

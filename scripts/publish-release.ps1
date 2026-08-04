# Creates a GitHub release for the current version and uploads the Linux
# packages plus the broadcast pack. The packages themselves are built by the
# Build Linux workflow (Ubuntu runner); this script only publishes.
# Uses the token already stored in Git Credential Manager; the token is kept
# in-process and never printed.
$ErrorActionPreference = "Stop"
$repo = "pikespeak83/Doomsday_Archive"
$root = "C:\Users\Cadyn\Documents\Doomsday_Archive"
$version = (Get-Content "$root\package.json" | ConvertFrom-Json).version
$tag = "v$version"

# pull the stored credential for github.com without echoing it
$credInput = "protocol=https`nhost=github.com`n`n"
$cred = $credInput | git credential fill
$token = ($cred | Where-Object { $_ -like "password=*" }) -replace "^password=", ""
if (-not $token) { Write-Host "NO TOKEN FOUND"; exit 1 }
$headers = @{ Authorization = "Bearer $token"; Accept = "application/vnd.github+json"; "User-Agent" = "doomsday-release-script" }

# create (or fetch existing) release
try {
  $release = Invoke-RestMethod -Method Post -Uri "https://api.github.com/repos/$repo/releases" -Headers $headers -Body (@{
    tag_name = $tag
    target_commitish = "main"
    name = "Doomsday Archive $tag"
    body = "Offline household archive for Linux. Two apps: **Doomsday-Archive-Setup** (host node) and **Doomsday-Field-Terminal-Setup** (field devices), each as an AppImage (chmod +x and run) or a .deb. **Broadcast-Pack.zip** is the retro TV channel archive: the host retrieves it once from inside the app (BROADCAST > RETRIEVE) and then serves it to every field terminal over the LAN. Installed apps auto-check this page on launch when the grid is up."
  } | ConvertTo-Json)
  Write-Host "RELEASE CREATED: $($release.html_url)"
} catch {
  $resp = $_.Exception.Response
  if ($resp -and $resp.StatusCode.value__ -eq 422) {
    $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases/tags/$tag" -Headers $headers
    Write-Host "RELEASE EXISTS: $($release.html_url)"
  } else { throw }
}

# upload assets (replace if already present, skip whatever this run did not build)
$assets = @(
  "Doomsday-Archive-Setup-$version.AppImage",
  "Doomsday-Field-Terminal-Setup-$version.AppImage",
  "Doomsday-Archive-Setup-$version.deb",
  "Doomsday-Field-Terminal-Setup-$version.deb",
  "Broadcast-Pack.zip"
)
foreach ($name in $assets) {
  $file = Join-Path "$root\release" $name
  if (-not (Test-Path $file)) { Write-Host "MISSING: $name"; continue }
  $existing = $release.assets | Where-Object { $_.name -eq $name }
  if ($existing -and $existing.state -eq "uploaded" -and $existing.size -eq (Get-Item $file).Length) {
    Write-Host "ALREADY UPLOADED: $name"
    continue
  }
  if ($existing) {
    Invoke-RestMethod -Method Delete -Uri "https://api.github.com/repos/$repo/releases/assets/$($existing.id)" -Headers $headers | Out-Null
    Write-Host "REPLACING: $name"
  }
  # curl.exe streams large files reliably where Invoke-RestMethod drops the
  # connection; the token rides in a temp config file, never on the command line
  $uploadUri = "https://uploads.github.com/repos/$repo/releases/$($release.id)/assets?name=$name"
  $cfgFile = Join-Path $env:TEMP ("gh-upload-" + [guid]::NewGuid().ToString("n") + ".cfg")
  @(
    "header = ""Authorization: Bearer $token"""
    "header = ""Content-Type: application/octet-stream"""
    "header = ""Accept: application/vnd.github+json"""
  ) | Set-Content -Path $cfgFile -Encoding ASCII
  try {
    $raw = & curl.exe -sS --fail-with-body --retry 3 --retry-delay 5 --retry-all-errors -K $cfgFile -X POST --data-binary "@$file" $uploadUri
    if ($LASTEXITCODE -ne 0) { throw "curl exit $LASTEXITCODE :: $raw" }
    $up = $raw | ConvertFrom-Json
    Write-Host ("UPLOADED: {0} ({1:N1} MB) state={2}" -f $up.name, ($up.size / 1MB), $up.state)
  } finally {
    Remove-Item $cfgFile -Force -ErrorAction SilentlyContinue
  }
}
Write-Host "DONE"

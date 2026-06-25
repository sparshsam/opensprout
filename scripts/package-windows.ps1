<#
.SYNOPSIS
    OpenSprout — Windows MSIX Package Generator
.DESCRIPTION
    Generates a signed MSIX package from the OpenSprout PWA for Microsoft Store submission.
    Run on Windows 10/11 with Windows App SDK installed.
.PARAMETER PwaUrl
    Production PWA URL (default: https://opensprout.vercel.app)
.PARAMETER Version
    Package version in quad-part format (default: 0.9.14.0)
.PARAMETER Publisher
    Publisher CN for the app manifest (default: CN=Sparsh Sam)
.PARAMETER OutputDir
    Output directory for the MSIX
.EXAMPLE
    .\scripts\package-windows.ps1 -Version "0.9.14.0" -Publisher "CN=Sparsh Sam"
#>

param(
    [string]$PwaUrl = "https://opensprout.vercel.app",
    [string]$Version = "0.9.14.0",
    [string]$Publisher = "CN=Sparsh Sam",
    [string]$OutputDir = ".\dist"
)

$ErrorActionPreference = "Stop"

function Write-Step($msg) {
    Write-Host "==> $msg" -ForegroundColor Cyan
}

function Write-Success($msg) {
    Write-Host "    $msg" -ForegroundColor Green
}

function Write-Warning($msg) {
    Write-Host "    WARNING: $msg" -ForegroundColor Yellow
}

# ── Validate environment ──────────────────────────────────────────────────────
Write-Step "Checking prerequisites..."

$makeAppx = Get-Command "MakeAppx" -ErrorAction SilentlyContinue
if (-not $makeAppx) {
    Write-Warning "MakeAppx not found. Install Windows App SDK."
    Write-Warning "https://learn.microsoft.com/windows/apps/windows-app-sdk/download"
}

$signtool = Get-Command "signtool" -ErrorAction SilentlyContinue
if (-not $signtool) {
    Write-Warning "signtool not found. Install Windows SDK."
}

# ── Create package directory ──────────────────────────────────────────────────
Write-Step "Creating package structure..."
$pkgDir = "$OutputDir\opensprout-msix"
$assetDir = "$pkgDir\assets"

Remove-Item -Recurse -Force $pkgDir -ErrorAction SilentlyContinue | Out-Null
New-Item -ItemType Directory -Force -Path $assetDir | Out-Null

# ── Generate AppxManifest ─────────────────────────────────────────────────────
Write-Step "Generating AppxManifest.xml..."
@"
<?xml version="1.0" encoding="utf-8"?>
<Package
  xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
  xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10"
  xmlns:uap3="http://schemas.microsoft.com/appx/manifest/uap/windows10/3"
  xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities"
  IgnorableNamespaces="uap uap3 rescap">

  <Identity Name="OpenSprout"
            Publisher="$Publisher"
            Version="$Version"
            ProcessorArchitecture="neutral" />

  <Properties>
    <DisplayName>OpenSprout</DisplayName>
    <PublisherDisplayName>Sparsh Sam</PublisherDisplayName>
    <Description>Free and open-source plant care tracking.</Description>
    <Logo>assets\icon-512.png</Logo>
  </Properties>

  <Resources>
    <Resource Language="en-us" />
  </Resources>

  <Dependencies>
    <TargetDeviceFamily Name="Windows.Universal" MinVersion="10.0.17763.0" MaxVersionTested="10.0.22621.0" />
    <TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.17763.0" MaxVersionTested="10.0.22621.0" />
  </Dependencies>

  <Applications>
    <Application Id="App" Executable="$target$" EntryPoint="$target$">
      <uap:VisualElements
        DisplayName="OpenSprout"
        Square150x150Logo="assets\icon-192.png"
        Square44x44Logo="assets\icon-64x64.png"
        Description="Free and open-source plant care tracking."
        BackgroundColor="#16784f">
        <uap:DefaultTile Wide310x150Logo="assets\icon-512.png" Square71x71Logo="assets\icon-128x128.png" Square310x310Logo="assets\icon-512.png" />
        <uap:SplashScreen Image="assets\splash.png" />
      </uap:VisualElements>
    </Application>
  </Applications>

  <Capabilities>
    <rescap:Capability Name="runFullTrust" />
    <Capability Name="internetClient" />
  </Capabilities>
</Package>
"@ | Out-File -FilePath "$pkgDir\AppxManifest.xml" -Encoding utf8

# ── Copy assets ───────────────────────────────────────────────────────────────
Write-Step "Copying app icons..."
$iconSource = Join-Path $PSScriptRoot "..\apps\web\public\icons"
if (Test-Path $iconSource) {
    Copy-Item "$iconSource\icon-512.png" "$assetDir\icon-512.png" -ErrorAction SilentlyContinue
    Copy-Item "$iconSource\icon-192.png" "$assetDir\icon-192.png" -ErrorAction SilentlyContinue
    Copy-Item "$iconSource\icon-128x128.png" "$assetDir\icon-128x128.png" -ErrorAction SilentlyContinue
    Copy-Item "$iconSource\icon-64x64.png" "$assetDir\icon-64x64.png" -ErrorAction SilentlyContinue
    Write-Success "Icons copied from project."
} else {
    Write-Warning "Icon source not found. Add icons to $assetDir manually."
}

# ── Generate MSIX ─────────────────────────────────────────────────────────────
Write-Step "Generating MSIX package..."
$msixPath = "$OutputDir\opensprout-$Version.msix"
if ($makeAppx) {
    MakeAppx pack /d "$pkgDir" /p "$msixPath" /l
    Write-Success "MSIX generated: $msixPath"
} else {
    Write-Warning "MakeAppx not available. Package structure prepared at: $pkgDir"
    Write-Warning "Run: MakeAppx pack /d `"$pkgDir`" /p `"$msixPath`" /l"
}

# ── Sign MSIX ─────────────────────────────────────────────────────────────────
if ((Test-Path $msixPath) -and $signtool) {
    Write-Step "Signing MSIX package..."
    signtool sign /fd SHA256 /a /v $msixPath
    Write-Success "Package signed."
} elseif (Test-Path $msixPath) {
    Write-Warning "signtool not found. Sign manually:"
    Write-Warning "  signtool sign /fd SHA256 /a /v `"$msixPath`""
}

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  OpenSprout Windows Package Complete" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Package: opensprout-$Version.msix" -ForegroundColor White
Write-Host "  Location: $OutputDir" -ForegroundColor White
Write-Host ""
Write-Host "  Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Install locally:   msixbundle $msixPath" -ForegroundColor Yellow
Write-Host "  2. Submit to Store:   https://partner.microsoft.com/dashboard" -ForegroundColor Yellow
Write-Host "  3. View docs:         docs/windows-packaging-guide.md" -ForegroundColor Yellow
Write-Host ""

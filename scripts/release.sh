#!/usr/bin/env bash
#
# OpenSprout — Release Automation Script
# Run: bash scripts/release.sh
#
# This script automates the full release pipeline:
#   1. Version bump (interactive)
#   2. Web production build
#   3. MCP server build
#   4. TypeScript typecheck
#   5. MCP tests
#   6. Android release AAB + APK
#   7. Lint
#
# Usage:
#   bash scripts/release.sh              # Interactive version prompt
#   bash scripts/release.sh 0.9.25       # Specific version
#   bash scripts/release.sh --android-only  # Skip web, just build Android
#   bash scripts/release.sh --check-only    # Just run checks, no builds
#

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log()  { echo -e "${CYAN}==>${NC} $1"; }
ok()   { echo -e "${GREEN}  ✓${NC} $1"; }
warn() { echo -e "${YELLOW}  ⚠${NC} $1"; }
err()  { echo -e "${RED}  ✗${NC} $1"; }

ANDROID_ONLY=false
CHECK_ONLY=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --android-only) ANDROID_ONLY=true; shift ;;
    --check-only)   CHECK_ONLY=true; shift ;;
    *) VERSION="$1"; shift ;;
  esac
done

# ── Version bump ────────────────────────────────────────────────────────────

if [ -z "${VERSION:-}" ]; then
  CURRENT=$(node -p "require('./package.json').version")
  echo -e "${CYAN}Current version:${NC} $CURRENT"
  read -rp "New version (or press Enter to keep $CURRENT): " VERSION
  VERSION="${VERSION:-$CURRENT}"
fi

log "Releasing OpenSprout v$VERSION"

# ── Checks ──────────────────────────────────────────────────────────────────

if [ "$ANDROID_ONLY" = false ]; then
  log "Installing dependencies..."
  npm ci --silent 2>/dev/null || npm install --silent

  log "Running lint..."
  if npm run lint 2>/dev/null; then ok "Lint passed"; else warn "Lint had warnings"; fi

  log "Building MCP server..."
  npm run -w @opensprout/mcp build
  ok "MCP built"

  log "TypeScript typecheck (web)..."
  npx tsc --noEmit --project apps/web/tsconfig.json
  ok "Web types pass"

  log "TypeScript typecheck (MCP)..."
  npx tsc --noEmit --project apps/mcp/tsconfig.json
  ok "MCP types pass"

  log "Running MCP tests..."
  npm run -w @opensprout/mcp test
  ok "All MCP tests pass"

  log "Building web..."
  npm run build
  ok "Web build complete"
fi

if [ "$CHECK_ONLY" = true ]; then
  log "Check-only mode — skipping Android and packaging."
  echo -e "\n${GREEN}========================================${NC}"
  echo -e "${GREEN}  OpenSprout v$VERSION checks passed${NC}"
  echo -e "${GREEN}========================================${NC}"
  exit 0
fi

# ── Android build ────────────────────────────────────────────────────────────

if [ -d "apps/web/android" ]; then
  log "Building Android release..."

  log "Syncing Capacitor..."
  cd apps/web
  CAPACITOR_BUILD=true npx next build 2>/dev/null || true
  npx cap sync android 2>/dev/null || npx cap copy android
  cd "$ROOT_DIR"

  log "Building release AAB..."
  cd apps/web/android
  ./gradlew bundleRelease 2>&1 | tail -5
  cd "$ROOT_DIR"

  AAB_PATH="apps/web/android/app/build/outputs/bundle/release/app-release.aab"
  if [ -f "$AAB_PATH" ]; then
    ok "AAB generated: $AAB_PATH"
  else
    warn "AAB not found at $AAB_PATH — check for build errors above"
  fi

  log "Building release APK..."
  cd apps/web/android
  ./gradlew assembleRelease 2>&1 | tail -5
  cd "$ROOT_DIR"

  APK_PATH="apps/web/android/app/build/outputs/apk/release/app-release.apk"
  if [ -f "$APK_PATH" ]; then
    ok "APK generated: $APK_PATH"
  else
    warn "APK not found — check for build errors above"
  fi
else
  warn "Android directory not found — skipping Android build"
fi

# ── Version update ──────────────────────────────────────────────────────────

if [ "$VERSION" != "$(node -p "require('./package.json').version")" ]; then
  log "Updating version to $VERSION..."
  node scripts/bump-version.mjs "$VERSION"
  ok "Version bumped to $VERSION"
fi

# ── Summary ──────────────────────────────────────────────────────────────────

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  OpenSprout v$VERSION Release Ready${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  Web:        ${CYAN}npm run build${NC}"
echo -e "  Android:    ${CYAN}npm run android:release${NC}"
echo -e "  Windows:    ${CYAN}pwsh scripts/package-windows.ps1${NC}"
echo ""
echo -e "  ${YELLOW}Publish Checklist:${NC}"
echo -e "  1. Push to main → Vercel auto-deploys"
echo -e "  2. Upload AAB to Google Play Console"
echo -e "  3. Run scripts/package-windows.ps1 for MSIX"
echo -e "  4. Upload MSIX to Microsoft Partner Center"
echo -e "  5. Tag release: git tag v$VERSION && git push origin v$VERSION"
echo ""

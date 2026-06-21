# OpenSprout Versioning Strategy

**Last updated:** June 21, 2026

---

## 1. Semantic Versioning

OpenSprout follows **Semantic Versioning 2.0.0** with the format `MAJOR.MINOR.PATCH`.

### Format

```
vMAJOR.MINOR.PATCH
```

### Rules

| Component | When to increment | Example |
|-----------|-------------------|---------|
| **MAJOR** | Breaking API or data model changes; significant UX rewrites | v0.x → v1.0 (first stable) |
| **MINOR** | New features, store releases, non-breaking additions | v0.9.1 → v0.9.2 |
| **PATCH** | Bug fixes, security patches, documentation updates | v0.9.2 → v0.9.3 |

### Current Version

Current: **v0.9.2**  
Stable target: **v1.0.0**

### What "Breaking" Means

A change is **breaking** if it requires manual action from users or integrators:

- Database schema changes that are not backward-compatible
- Removal of public API endpoints or MCP tools
- Changes to data export format
- Dropped platform support (e.g., minimum Android SDK bump)

## 2. Release Process

### 2.1 Branch Strategy

```
main  ──────●────────────●────────────●────
             \          /            /
feat/*  ──────●────────●────────────/
              \      /
hotfix/*  ─────●────●
```

- **`main`** — Production branch. Always deployable. Protected with CI checks and review requirements.
- **`feat/*`** — Feature branches. Merged via squash PR after CI passes.
- **`fix/*`** — Bug fix branches. Same workflow as feature branches.
- **`hotfix/*`** — Urgent production fixes. May skip the full feature cycle.

### 2.2 Release Steps

1. **Create branch:** `feat/vX.Y.Z-description`
2. **Implement:** All changes on the feature branch
3. **Validate:**
   ```bash
   npm run lint        # 0 errors
   npm run typecheck   # clean
   npm run build       # successful
   npm run build:mobile
   npx cap sync
   npm test            # if tests exist
   ```
4. **Open PR:** Against `main` with changelog summary
5. **CI checks:** All required status checks must pass
6. **Review:** At least one approval (applies to non-owner contributors)
7. **Merge:** Squash merge into `main`
8. **Tag:** `git tag vX.Y.Z && git push origin vX.Y.Z`
9. **Release notes:** Published on GitHub Releases with changelog

### 2.3 Release Cadence

- **Minor releases:** Every 2–4 weeks as features accumulate
- **Patch releases:** As needed for bug fixes and security updates
- **Major releases:** Planned, with migration guides and deprecation notices

## 3. Changelog Workflow

### 3.1 Format

The changelog follows [Keep a Changelog](https://keepachangelog.com/) conventions.

### 3.2 Categories

| Category | Usage |
|----------|-------|
| **Added** | New features |
| **Changed** | Changes in existing functionality |
| **Deprecated** | Soon-to-be-removed features |
| **Removed** | Removed features |
| **Fixed** | Bug fixes |
| **Security** | Vulnerability fixes |

### 3.3 Entry Format

```markdown
## X.Y.Z - YYYY-MM-DD

### Added
- Feature description. (#PR)

### Changed
- Change description. (#PR)

### Fixed
- Bug fix description. (#PR)
```

### 3.4 Maintenance

- The changelog lives at `CHANGELOG.md` in the repo root.
- Entries are added during development (not retroactively).
- Each release section is finalized at PR merge.
- Unreleased changes go under a `## Unreleased` heading.

## 4. Tagging

### 4.1 Convention

Tags follow the format `vMAJOR.MINOR.PATCH`:
```bash
git tag v0.9.2
git push origin v0.9.2
```

### 4.2 Tag Types

- **Release tags:** Git tags on main after merge (e.g., `v0.9.2`)
- **Pre-release tags:** `vX.Y.Z-rc.N` for release candidates (e.g., `v0.9.2-rc.1`)

### 4.3 GitHub Releases

Each tag should be accompanied by a GitHub Release with:
- Release title matching the tag
- Changelog summary
- Links to PRs
- Known issues (if any)
- Download links for Android APK/AAB

## 5. Version Tracking

### 5.1 Where Versions Are Defined

| Location | File |
|----------|------|
| Source of truth | `CHANGELOG.md` |
| Git tag | Repository tags |
| Package version | `package.json` (`"version": "0.1.0"`) |
| Web app display | Settings → About section |
| Android version | `apps/web/android/app/build.gradle.kts` |
| Android versionCode | `apps/web/android/app/build.gradle.kts` |

**Note:** The `package.json` version (0.1.0) lags behind git tags. Git tags are the authoritative release indicator. This is acceptable for monorepo development where the package version reflects the package, and release tags reflect the full application.

## 6. Version Display in App

The current version is displayed in:
- **Settings → About OpenSprout**
- Android app's system settings (if configured)

## 7. Breaking Changes Policy

When introducing breaking changes:

1. **Deprecation notice:** Mark the old behavior as deprecated one minor version before removal.
2. **Migration path:** Provide clear instructions or a migration script.
3. **Major version:** The breaking change triggers a MAJOR version bump.
4. **Communication:** Post the change in GitHub releases and the app's Settings page.

## 8. Pre-Release (v0.x) Exceptions

While in pre-1.0 development (v0.x):

- **Minor versions** may include breaking changes with clear documentation.
- **No long-term deprecation window** is guaranteed, though we strive to mark changes.
- The v0.x series prioritizes rapid iteration toward a stable v1.0 API.

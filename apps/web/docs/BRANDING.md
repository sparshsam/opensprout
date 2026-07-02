# OpenSprout Branding

## Ecosystem Hierarchy

```
KOVINA          Parent ecosystem     → kovina.org/standards/KOVINA_MANIFESTO.md
  ↓
OPEN            Product family       → kovina.org/standards/BRAND_GUIDELINES.md
  ↓
Sprout          Individual product   → docs/BRANDING.md
```

OpenSprout inherits Kovina ecosystem standards and Open Product Family branding guidelines.

## Open Product Family

The Open Product Family is a set of applications that share a common visual identity:

- **OPEN has no icon.** No symbol, no badge, no monogram. Typography only.
- The application icon belongs only to the product, never to OPEN.
- Do not merge the icon into the typography lockup.
- Do not create a combined logo mark.
- The header lockup is: `[icon] OPEN / <Product>` (stacked, icon on left).
- Never redesign the header lockup without explicit instruction.
- OpenPalette is the canonical reference implementation for the Open Product Family branding.

## OpenSprout Branding

| Property | Value |
|----------|-------|
| Application name | OpenSprout |
| Icon | `opensprout-icon.png` (PNG, 1024x1024 source) |
| Accent color | `#16784f` (green) |
| Font | Sora (variable, weights 300-800) |
| Domain | `sprout.kovina.org` |
| Tagline | Your plants. Your data. |
| Licenses | AGPLv3 |

### Header Lockup

The header lockup is:

```
[opensprout-icon.png]
OPEN
Sprout
```

Implementation details:
- The icon is displayed on the left (24px height equivalent).
- "OPEN" is rendered in uppercase at 10px, bold, with 0.06em letter spacing, in muted/50% opacity color.
- "Sprout" is rendered as the product name at the appropriate heading size, bold, with the primary color on hover.
- Both lines are stacked vertically with tight leading and a small negative margin (-0.5) between them.
- The entire lockup is a single clickable `<Link>` element.

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#16784f` (hsl(155, 68%, 28%)) | Accent, buttons, links |
| Primary dark | hsl(155, 52%, 44%) | Dark mode accent |
| Background light | Warm white | Light mode |
| Background dark | Deep botanical | Dark mode |

### Design Principles

- Editorial, plant-first, premium indie product
- No SaaS dashboard feel — no metric cards, no card grids
- Hierarchy via typography and spacing, not borders
- Buttons are pills (`rounded-full`)
- Calm UX — plant care should reduce stress, not add urgency

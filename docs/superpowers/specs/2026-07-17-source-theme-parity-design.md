# Source Theme Parity Design

## Goal

Replace the Sub2API frontend's blue-gray dark surfaces and teal primary controls with the neutral dark surfaces and monochrome primary controls used by the QuotaJet main site at `D:\Code\QuotaJet.com\QuotaJet.com`.

## Scope

- Apply globally to the public shell, authentication pages, user dashboard, admin dashboard, dialogs, cards, tables, sidebars, inputs, hover states, and primary buttons.
- Preserve semantic success, warning, error, info, chart, provider, and identity colors.
- Preserve the landing page's existing source-parity palette and Three.js implementation.
- Do not add runtime or build-time dependencies on the sibling main-site repository.

## Approaches Considered

1. **Replace shared Tailwind palettes (selected).** Update the `dark` and `primary` scales once so existing utility classes inherit the source-site visual system. This has the broadest coverage with the smallest and safest diff.
2. **Add CSS overrides.** This would require high-specificity selectors and would miss dynamically composed Tailwind classes.
3. **Edit pages individually.** This would be repetitive, fragile, and likely leave inconsistent blue-gray surfaces behind.

## Color Mapping

Use source-site OKLCH values directly rather than approximate hex colors.

### Dark Surfaces

- `dark-950`: sidebar/deepest surface, `oklch(0.225 0 0)`.
- `dark-900`: page background, `oklch(0.235 0 0)`.
- `dark-800`: card surface, `oklch(0.285 0 0)`.
- `dark-700`: popover/muted surface, `oklch(0.305 0 0)`.
- `dark-600`: secondary surface, `oklch(0.335 0 0)`.
- `dark-500`: hover/accent surface, `oklch(0.365 0 0)`.
- Lighter `dark-400..50` values remain neutral and follow the main site's foreground and muted-foreground hierarchy.

The existing blue-gray `gradient-dark` and onboarding dark background must use the same neutral surface values.

### Primary Controls

- Light mode primary buttons use the main-site near-black primary with near-white text.
- Dark mode primary buttons use the main-site near-white primary with near-black text.
- Hover, active, disabled, focus-ring, selected-tab, checkbox, switch, and compact action-button states use adjacent neutral values from the same primary scale.
- Semantic colored controls remain unchanged.

## Implementation Boundaries

- Update `frontend/tailwind.config.js` as the source of truth for shared `dark-*` and `primary-*` utilities.
- Update shared button contracts in `frontend/src/style.css` where one utility definition cannot express the source site's light/dark inversion.
- Replace only verified hard-coded blue-gray dark backgrounds or gradients that bypass the shared palette.
- Do not mass-edit component files when their existing utility classes already inherit the corrected palettes.

## Verification

- Add focused tests for the Tailwind palette and shared primary-button contract.
- Run frontend lint, typecheck, critical Vitest suite, and production build.
- Visually verify light and dark modes on the homepage, login page, user dashboard, and admin dashboard.
- Confirm no remaining global dark background uses the former `#020617`, `#0f172a`, or `#1e293b` blue-gray values outside intentionally colored semantic content.


# Source Theme Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the target frontend's blue-gray dark theme and teal primary controls with the QuotaJet main site's neutral charcoal surfaces and monochrome light/dark primary controls.

**Architecture:** Keep existing Tailwind utility usage intact. Repoint the shared `dark` scale to exact source-site neutral OKLCH values, repoint `primary` utilities to CSS-variable-backed monochrome values that invert by theme, and update the shared button contract plus the two verified hard-coded blue-gray surfaces. Existing components inherit the change without page-by-page edits.

**Tech Stack:** Vue 3, TypeScript 5.6, Tailwind CSS 3, Vitest, pnpm 9.

## Global Constraints

- Main-site source of truth: `D:\Code\QuotaJet.com\QuotaJet.com`.
- Target repository: `D:\Code\QuotaJet.com\sub.quotajet.com`.
- Apply globally to public, authentication, user, and admin frontend surfaces.
- Preserve semantic success, warning, error, info, chart, provider, and identity colors.
- Preserve the landing page's existing source-parity palette and Three.js behavior.
- Do not add runtime or build-time sibling repository dependencies.
- Primary controls are near-black with near-white text in light mode and near-white with near-black text in dark mode.
- Use the source site's exact neutral OKLCH values rather than approximate blue-gray hex colors.

---

### Task 1: Replace Shared Theme Tokens and Primary Controls

**Files:**
- Create: `frontend/src/__tests__/sourceThemeParity.spec.ts`
- Modify: `frontend/tailwind.config.js:8-49`
- Modify: `frontend/tailwind.config.js:77-80`
- Modify: `frontend/src/style.css:1-25`
- Modify: `frontend/src/style.css:77-83`
- Modify: `frontend/src/styles/onboarding.css:112-117`

**Interfaces:**
- Consumes: existing `dark-*`, `primary-*`, `.btn`, and `.btn-primary` Tailwind contracts.
- Produces: source-aligned global dark surfaces and theme-aware monochrome primary utilities without component API changes.

- [ ] **Step 1: Write the failing source-theme contract test**

Create `frontend/src/__tests__/sourceThemeParity.spec.ts`:

```ts
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const tailwindSource = readFileSync(resolve(frontendRoot, 'tailwind.config.js'), 'utf8')
const globalStyleSource = readFileSync(resolve(frontendRoot, 'src/style.css'), 'utf8')
const onboardingSource = readFileSync(resolve(frontendRoot, 'src/styles/onboarding.css'), 'utf8')

describe('source-aligned global theme', () => {
  it('uses the QuotaJet neutral dark surface scale', () => {
    expect(tailwindSource).toContain("950: 'oklch(0.225 0 0)'")
    expect(tailwindSource).toContain("900: 'oklch(0.235 0 0)'")
    expect(tailwindSource).toContain("800: 'oklch(0.285 0 0)'")
    expect(tailwindSource).toContain("700: 'oklch(0.305 0 0)'")
    expect(tailwindSource).not.toContain("900: '#0f172a'")
    expect(tailwindSource).not.toContain("800: '#1e293b'")
    expect(tailwindSource).not.toContain("950: '#020617'")
  })

  it('backs primary utilities with theme-aware OKLCH variables', () => {
    expect(tailwindSource).toContain("500: 'oklch(var(--qj-primary-500) / <alpha-value>)'")
    expect(globalStyleSource).toContain('--qj-primary-500: 0.13 0 0;')
    expect(globalStyleSource).toContain('--qj-primary-500: 0.965 0 0;')
  })

  it('uses a flat monochrome shared primary button', () => {
    const buttonBlock = globalStyleSource.match(/\.btn-primary\s*\{[\s\S]*?\n {2}\}/)?.[0]
    expect(buttonBlock).toContain('@apply bg-primary-500 text-primary-50;')
    expect(buttonBlock).toContain('@apply hover:bg-primary-600;')
    expect(buttonBlock).not.toContain('bg-gradient-to-r')
    expect(buttonBlock).not.toContain('shadow-primary')
  })

  it('removes verified hard-coded blue-gray dark surfaces', () => {
    expect(tailwindSource).not.toContain('linear-gradient(135deg, #1e293b 0%, #0f172a 100%)')
    expect(onboardingSource).not.toContain('#0f172a')
    expect(onboardingSource).not.toContain('#1e293b')
  })
})
```

- [ ] **Step 2: Run the test and confirm RED**

Run:

```bash
pnpm --dir frontend exec vitest run src/__tests__/sourceThemeParity.spec.ts
```

Expected: FAIL because the target still uses the slate blue-gray `dark` scale, teal primary scale, gradient primary button, and hard-coded onboarding colors.

- [ ] **Step 3: Replace the Tailwind dark and primary scales**

In `frontend/tailwind.config.js`, replace `primary` with CSS-variable-backed OKLCH colors:

```js
primary: {
  50: 'oklch(var(--qj-primary-50) / <alpha-value>)',
  100: 'oklch(var(--qj-primary-100) / <alpha-value>)',
  200: 'oklch(var(--qj-primary-200) / <alpha-value>)',
  300: 'oklch(var(--qj-primary-300) / <alpha-value>)',
  400: 'oklch(var(--qj-primary-400) / <alpha-value>)',
  500: 'oklch(var(--qj-primary-500) / <alpha-value>)',
  600: 'oklch(var(--qj-primary-600) / <alpha-value>)',
  700: 'oklch(var(--qj-primary-700) / <alpha-value>)',
  800: 'oklch(var(--qj-primary-800) / <alpha-value>)',
  900: 'oklch(var(--qj-primary-900) / <alpha-value>)',
  950: 'oklch(var(--qj-primary-950) / <alpha-value>)'
},
```

Replace `dark` with the source site's neutral hierarchy:

```js
dark: {
  50: 'oklch(0.985 0 0)',
  100: 'oklch(0.965 0 0)',
  200: 'oklch(0.9 0 0)',
  300: 'oklch(0.78 0 0)',
  400: 'oklch(0.68 0 0)',
  500: 'oklch(0.44 0 0)',
  600: 'oklch(0.335 0 0)',
  700: 'oklch(0.305 0 0)',
  800: 'oklch(0.285 0 0)',
  900: 'oklch(0.235 0 0)',
  950: 'oklch(0.225 0 0)'
},
```

Replace `gradient-dark` with:

```js
'gradient-dark': 'linear-gradient(135deg, oklch(0.285 0 0) 0%, oklch(0.235 0 0) 100%)',
```

- [ ] **Step 4: Add theme-aware primary variables**

At the start of the existing `@layer base` block in `frontend/src/style.css`, add:

```css
:root {
  --qj-primary-50: 0.985 0 0;
  --qj-primary-100: 0.955 0 0;
  --qj-primary-200: 0.895 0 0;
  --qj-primary-300: 0.78 0 0;
  --qj-primary-400: 0.49 0 0;
  --qj-primary-500: 0.13 0 0;
  --qj-primary-600: 0.235 0 0;
  --qj-primary-700: 0.305 0 0;
  --qj-primary-800: 0.335 0 0;
  --qj-primary-900: 0.365 0 0;
  --qj-primary-950: 0.155 0 0;
}

.dark {
  --qj-primary-50: 0.155 0 0;
  --qj-primary-100: 0.965 0 0;
  --qj-primary-200: 0.9 0 0;
  --qj-primary-300: 0.78 0 0;
  --qj-primary-400: 0.68 0 0;
  --qj-primary-500: 0.965 0 0;
  --qj-primary-600: 0.9 0 0;
  --qj-primary-700: 0.78 0 0;
  --qj-primary-800: 0.365 0 0;
  --qj-primary-900: 0.335 0 0;
  --qj-primary-950: 0.305 0 0;
}
```

- [ ] **Step 5: Replace the shared primary-button contract**

Replace `.btn-primary` in `frontend/src/style.css` with:

```css
.btn-primary {
  @apply bg-primary-500 text-primary-50;
  @apply shadow-md shadow-black/10;
  @apply hover:bg-primary-600 hover:shadow-lg hover:shadow-black/15;
}
```

Add a compatibility rule for existing compact controls that explicitly pair a primary background with `text-white`:

```css
.dark :is(button, a, [role='button']).bg-primary-500.text-white,
.dark :is(button, a, [role='button']).bg-primary-600.text-white,
.dark :is(button, a, [role='button']).bg-primary-700.text-white {
  color: oklch(0.155 0 0);
}
```

- [ ] **Step 6: Replace the onboarding hard-coded dark surface**

In `frontend/src/styles/onboarding.css`, replace the dark footer rule with:

```css
.dark .theme-tour-popover .driver-popover-footer {
  background-color: oklch(0.235 0 0) !important;
  border-top-color: oklch(1 0 0 / 10%) !important;
}
```

- [ ] **Step 7: Run focused verification and confirm GREEN**

Run:

```bash
pnpm --dir frontend exec vitest run src/__tests__/sourceThemeParity.spec.ts
pnpm --dir frontend run lint:check
pnpm --dir frontend run typecheck
pnpm --dir frontend run build
git diff --check
```

Expected: every command exits `0`; the focused test reports four passing tests and the production build emits assets into `backend/internal/web/dist`.

- [ ] **Step 8: Commit the theme implementation**

```bash
git add frontend/tailwind.config.js frontend/src/style.css frontend/src/styles/onboarding.css frontend/src/__tests__/sourceThemeParity.spec.ts
git commit -m "feat: align global theme with QuotaJet"
```

---

### Task 2: Verify Global Visual Coverage

**Files:**
- Test: homepage, login page, user dashboard, and admin dashboard.
- Modify only if verification finds a source-theme mismatch within the approved token layer: `frontend/src/style.css` or `frontend/src/styles/onboarding.css`.

**Interfaces:**
- Consumes: Task 1 global `dark-*` and `primary-*` contracts.
- Produces: browser evidence that global surfaces and primary controls match the source-site theme in light and dark modes.

- [ ] **Step 1: Audit remaining former blue-gray background values**

Run:

```bash
rg -n "#020617|#0f172a|#1e293b" frontend/src frontend/tailwind.config.js \
  -g "*.css" -g "*.vue" -g "*.ts" -g "*.js"
```

Expected: no global dark background, card, sidebar, popover, input, button, or gradient uses those values. Semantic instructional content may retain a blue status surface only when it is visibly an info state rather than the page theme.

- [ ] **Step 2: Start the local frontend**

Run:

```bash
pnpm --dir frontend run dev -- --host 127.0.0.1 --port 4173
```

Expected: Vite serves the target at `http://127.0.0.1:4173/`.

- [ ] **Step 3: Verify global light and dark surfaces**

At desktop `1440x900` and mobile `390x844`, inspect `/home`, `/login`, `/dashboard`, and `/admin/dashboard` where access permits. Verify:

- page canvas is neutral rather than blue-gray;
- sidebar uses `oklch(0.225 0 0)` in dark mode;
- cards use `oklch(0.285 0 0)` and hover/popover surfaces remain visibly separated;
- primary controls are near-black with light text in light mode and near-white with dark text in dark mode;
- semantic status colors remain colored;
- no text, icon, focus ring, or disabled state loses contrast;
- no layout, overflow, or responsive behavior changes.

- [ ] **Step 4: Run repository frontend verification**

Run:

```bash
mingw32-make test-frontend
mingw32-make build-frontend
git diff --check
git status --short --branch
```

Expected: lint, typecheck, the critical frontend suite, and production build exit `0`; the worktree contains only intentional reviewed changes or is clean after a visual-fix commit.

- [ ] **Step 5: Commit only verified visual corrections**

If Step 3 requires a correction:

```bash
git add frontend/src/style.css frontend/src/styles/onboarding.css
git commit -m "fix: complete source theme parity"
```

If a mismatch originates in a component-level hard-coded color, report it as a separate follow-up instead of expanding this global-token task. If no correction is needed, do not create an empty commit.

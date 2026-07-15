# QuotaJet Brand Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Sub2API fork consistently present the QuotaJet Logo, favicon, metadata, and runtime site identity while leaving production `quotajet.com` and NEWAPI untouched.

**Architecture:** Copy the main-site brand assets into the independent Sub2API repository, add static metadata to the Vue entry document, update only user-visible QuotaJet fallback values, and enforce persisted test-deployment brand settings through an idempotent PostgreSQL script. Existing CI deploys the branch only after it is merged to `main` and the full CI workflow succeeds.

**Tech Stack:** Vue 3, TypeScript, Vitest, Go, testify, PostgreSQL, Docker Compose, Bash, GitHub Actions.

## Global Constraints

- "Main site" means `D:\Code\QuotaJet.com\QuotaJet.com`.
- Metadata URLs must use `https://quotajet.com`, even on the test deployment.
- Do not modify production `quotajet.com`, its DNS, Nginx configuration, or the running NEWAPI deployment.
- Do not globally rename Sub2API technical identifiers, protocol names, package paths, storage keys, legal documents, or upstream links.
- The Sub2API repository must remain independently buildable without sibling filesystem dependencies.
- Main-site Logo SHA-256: `b4b0fa9bbc1bd2b074029d23db61a9b47fb0430626f24ab4f769af87bd04dc0c`.
- Main-site favicon SHA-256: `30fa75cd91c3a073fa4aa765ce3d4b4183e4cd0388dd657506479150958a48c7`.

---

### Task 1: Static Assets And Metadata

**Files:**
- Modify: `AGENTS.md`
- Modify: `frontend/index.html`
- Replace: `frontend/public/logo.png`
- Create: `frontend/public/favicon.ico`
- Create: `frontend/src/__tests__/brandMetadata.spec.ts`

**Interfaces:**
- Consumes: main-site tracked assets and metadata listed in Global Constraints.
- Produces: stable `/logo.png`, `/favicon.ico`, and future-domain QuotaJet metadata for the frontend build.

- [ ] **Step 1: Write the failing metadata and asset regression test**

Create `frontend/src/__tests__/brandMetadata.spec.ts` with Node filesystem assertions:

```ts
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const frontendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const readAssetHash = (name: string) => createHash('sha256')
  .update(readFileSync(resolve(frontendRoot, 'public', name)))
  .digest('hex')

describe('QuotaJet static brand', () => {
  it('ships the main-site Logo and favicon', () => {
    expect(readAssetHash('logo.png')).toBe('b4b0fa9bbc1bd2b074029d23db61a9b47fb0430626f24ab4f769af87bd04dc0c')
    expect(readAssetHash('favicon.ico')).toBe('30fa75cd91c3a073fa4aa765ce3d4b4183e4cd0388dd657506479150958a48c7')
  })

  it('advertises the future QuotaJet production identity', () => {
    const html = readFileSync(resolve(frontendRoot, 'index.html'), 'utf8')
    expect(html).toContain('<title>QuotaJet</title>')
    expect(html).toContain('content="https://quotajet.com/"')
    expect(html).toContain('content="https://quotajet.com/logo.png?v=quotajet-20260618"')
    expect(html).toContain('One private gateway for fast routes, fair pricing, and mainstream AI models.')
    expect(html).toContain('href="/favicon.ico?v=quotajet-20260618"')
  })
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run from `frontend/`:

```bash
pnpm exec vitest run src/__tests__/brandMetadata.spec.ts
```

Expected: FAIL because the current Logo hash differs, `favicon.ico` is missing, and QuotaJet metadata is absent.

- [ ] **Step 3: Copy assets and implement metadata**

Copy files byte-for-byte:

```powershell
Copy-Item 'D:\Code\QuotaJet.com\QuotaJet.com\web\default\public\logo.png' 'frontend\public\logo.png' -Force
Copy-Item 'D:\Code\QuotaJet.com\QuotaJet.com\web\default\public\favicon.ico' 'frontend\public\favicon.ico' -Force
```

Replace the `<head>` of `frontend/index.html` with the QuotaJet favicon, description, OpenGraph, Twitter, and theme metadata from the approved design. Keep the Vue module entry and `#app` root unchanged.

Use this complete head content:

```html
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/png" href="/logo.png?v=quotajet-20260618" />
  <link rel="shortcut icon" href="/favicon.ico?v=quotajet-20260618" />
  <link rel="apple-touch-icon" href="/logo.png?v=quotajet-20260618" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="google" content="notranslate" />
  <title>QuotaJet</title>
  <meta name="title" content="QuotaJet" />
  <meta name="description" content="One private gateway for fast routes, fair pricing, and mainstream AI models." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://quotajet.com/" />
  <meta property="og:site_name" content="QuotaJet" />
  <meta property="og:title" content="QuotaJet" />
  <meta property="og:description" content="One private gateway for fast routes, fair pricing, and mainstream AI models." />
  <meta property="og:image" content="https://quotajet.com/logo.png?v=quotajet-20260618" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="QuotaJet" />
  <meta name="twitter:description" content="One private gateway for fast routes, fair pricing, and mainstream AI models." />
  <meta name="twitter:image" content="https://quotajet.com/logo.png?v=quotajet-20260618" />
  <meta name="theme-color" content="#fff" />
</head>
```

Add this instruction to `AGENTS.md`:

```md
## Main Site Reference

- When the user says "main site", it means `D:\Code\QuotaJet.com\QuotaJet.com`.
- Main-site Logo and metadata are the QuotaJet brand source of truth.
- Copy required assets into this repository; never add runtime or build-time sibling filesystem dependencies.
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
pnpm exec vitest run src/__tests__/brandMetadata.spec.ts
```

Expected: PASS, 2 tests.

- [ ] **Step 5: Commit static branding**

```bash
git add AGENTS.md frontend/index.html frontend/public/logo.png frontend/public/favicon.ico frontend/src/__tests__/brandMetadata.spec.ts
git commit -m "feat: sync QuotaJet static brand"
```

### Task 2: Frontend Runtime Brand Fallbacks

**Files:**
- Modify: `frontend/src/router/__tests__/title.spec.ts`
- Modify: `frontend/src/router/title.ts`
- Modify: `frontend/src/stores/__tests__/app.spec.ts`
- Modify: `frontend/src/stores/app.ts`
- Modify: `frontend/src/views/auth/EmailVerifyView.vue`
- Modify: `frontend/src/views/auth/RegisterView.vue`
- Modify: `frontend/src/main.ts`

**Interfaces:**
- Consumes: `/logo.png` from Task 1 and public settings returned by the backend.
- Produces: `QuotaJet` and `/logo.png` as user-visible fallbacks before settings load.

- [ ] **Step 1: Change tests to require QuotaJet fallbacks**

Update `frontend/src/router/__tests__/title.spec.ts`:

```ts
expect(resolveDocumentTitle('Dashboard', '')).toBe('Dashboard - QuotaJet')
expect(resolveDocumentTitle(undefined, '   ')).toBe('QuotaJet')
```

Add to the existing app-store public settings test suite:

```ts
it('uses QuotaJet brand fallbacks when public settings omit them', async () => {
  const store = useAppStore()
  window.__APP_CONFIG__ = {
    registration_enabled: false,
    email_verify_enabled: false,
    site_name: '',
    site_logo: ''
  } as PublicSettings

  await store.fetchPublicSettings()

  expect(store.siteName).toBe('QuotaJet')
  expect(store.siteLogo).toBe('/logo.png')
})
```

- [ ] **Step 2: Run focused frontend tests and verify RED**

Run:

```bash
pnpm exec vitest run src/router/__tests__/title.spec.ts src/stores/__tests__/app.spec.ts
```

Expected: FAIL with current `Sub2API` and empty Logo fallbacks.

- [ ] **Step 3: Implement minimal frontend fallbacks**

Use `QuotaJet` as the site-name fallback and `/logo.png` as the site-Logo fallback in `router/title.ts` and `stores/app.ts`. Update the two authentication views and initial title handling in `main.ts` only where `Sub2API` currently means the deployed site identity.

- [ ] **Step 4: Run focused frontend tests and typecheck**

Run:

```bash
pnpm exec vitest run src/router/__tests__/title.spec.ts src/stores/__tests__/app.spec.ts
pnpm run type-check
```

Expected: focused tests PASS and typecheck exits 0.

- [ ] **Step 5: Commit frontend runtime branding**

```bash
git add frontend/src/router frontend/src/stores frontend/src/views/auth/EmailVerifyView.vue frontend/src/views/auth/RegisterView.vue frontend/src/main.ts
git commit -m "feat: use QuotaJet frontend defaults"
```

### Task 3: Backend Runtime Brand Defaults

**Files:**
- Modify: `backend/internal/service/setting_service_public_test.go`
- Create: `backend/internal/service/setting_brand_defaults_test.go`
- Modify: `backend/internal/service/setting_parse.go`
- Modify: `backend/internal/service/setting_public.go`

**Interfaces:**
- Produces: public settings with `SiteName == "QuotaJet"` and `SiteLogo == "/logo.png"` when persisted values are absent.
- Consumes: existing `SettingRepository` behavior and `SystemSettings`/`PublicSettings` structs.

- [ ] **Step 1: Write failing backend default tests**

Add a focused public-settings test:

```go
func TestSettingService_GetPublicSettings_UsesQuotaJetBrandDefaults(t *testing.T) {
    svc := NewSettingService(&settingPublicRepoStub{values: map[string]string{}}, &config.Config{})

    settings, err := svc.GetPublicSettings(context.Background())

    require.NoError(t, err)
    require.Equal(t, "QuotaJet", settings.SiteName)
    require.Equal(t, "/logo.png", settings.SiteLogo)
}
```

Create `setting_brand_defaults_test.go` with this complete repository stub and assertion:

```go
//go:build unit

package service

import (
    "context"
    "testing"

    "github.com/Wei-Shaw/sub2api/internal/config"
    "github.com/stretchr/testify/require"
)

type settingBrandRepoStub struct {
    written map[string]string
}

func (s *settingBrandRepoStub) Get(context.Context, string) (*Setting, error) {
    return nil, ErrSettingNotFound
}
func (s *settingBrandRepoStub) GetValue(context.Context, string) (string, error) {
    return "", ErrSettingNotFound
}
func (s *settingBrandRepoStub) Set(context.Context, string, string) error {
    panic("unexpected Set call")
}
func (s *settingBrandRepoStub) GetMultiple(context.Context, []string) (map[string]string, error) {
    panic("unexpected GetMultiple call")
}
func (s *settingBrandRepoStub) SetMultiple(_ context.Context, values map[string]string) error {
    s.written = values
    return nil
}
func (s *settingBrandRepoStub) GetAll(context.Context) (map[string]string, error) {
    panic("unexpected GetAll call")
}
func (s *settingBrandRepoStub) Delete(context.Context, string) error {
    panic("unexpected Delete call")
}

func TestSettingService_InitializeDefaultSettings_UsesQuotaJetBrand(t *testing.T) {
    repo := &settingBrandRepoStub{}
    svc := NewSettingService(repo, &config.Config{})

    err := svc.InitializeDefaultSettings(context.Background())

    require.NoError(t, err)
    require.Equal(t, "QuotaJet", repo.written[SettingKeySiteName])
    require.Equal(t, "/logo.png", repo.written[SettingKeySiteLogo])
    require.Equal(t, "true", repo.written[SettingKeyRegistrationEnabled])
}
```

- [ ] **Step 2: Run focused Go tests and verify RED**

Run from `backend/`:

```bash
go test -tags=unit ./internal/service -run 'TestSettingService_(GetPublicSettings_UsesQuotaJetBrandDefaults|InitializeDefaultSettings_UsesQuotaJetBrand)' -count=1
```

Expected: FAIL because current defaults are `Sub2API` and an empty Logo.

- [ ] **Step 3: Implement backend defaults**

Change only these brand defaults:

```go
SettingKeySiteName: "QuotaJet",
SettingKeySiteLogo: "/logo.png",
```

Use the same values in `parseSettings` and `GetPublicSettings` fallbacks. Do not change Sub2API technical identifiers elsewhere.

- [ ] **Step 4: Run focused Go tests and verify GREEN**

Run:

```bash
go test -tags=unit ./internal/service -run 'TestSettingService_(GetPublicSettings_UsesQuotaJetBrandDefaults|InitializeDefaultSettings_UsesQuotaJetBrand)' -count=1
```

Expected: PASS.

- [ ] **Step 5: Commit backend runtime branding**

```bash
git add backend/internal/service/setting_parse.go backend/internal/service/setting_public.go backend/internal/service/setting_service_public_test.go backend/internal/service/setting_brand_defaults_test.go
git commit -m "feat: use QuotaJet backend brand defaults"
```

### Task 4: Persisted Deployment Brand Sync

**Files:**
- Create: `deploy/quotajet-brand.sql`
- Modify: `deploy/quotajet-deploy.sh`
- Modify: `deploy/tests/quotajet-deploy-test.sh`

**Interfaces:**
- Consumes: PostgreSQL `settings(key, value, updated_at)` and the Compose project name `quotajet-sub2api`.
- Produces: idempotent persisted `site_name` and `site_logo` values before final health verification.

- [ ] **Step 1: Extend the deployment contract test**

Add assertions that require the SQL file and exact limited keys:

```bash
brand_sql="$repo_root/deploy/quotajet-brand.sql"
test -f "$brand_sql"
grep -q "'site_name', 'QuotaJet'" "$brand_sql"
grep -q "'site_logo', '/logo.png'" "$brand_sql"
test "$(grep -Ec "'site_[^']+'" "$brand_sql")" -eq 2
grep -q 'quotajet-brand.sql' "$deploy_script"
grep -q 'docker exec -i sub2api-postgres psql' "$deploy_script"
```

- [ ] **Step 2: Run deployment test and verify RED**

Run:

```bash
bash deploy/tests/quotajet-deploy-test.sh
```

Expected: FAIL because `deploy/quotajet-brand.sql` does not exist.

- [ ] **Step 3: Add idempotent SQL and deployment hook**

Create `deploy/quotajet-brand.sql`:

```sql
INSERT INTO settings (key, value, updated_at)
VALUES
  ('site_name', 'QuotaJet', CURRENT_TIMESTAMP),
  ('site_logo', '/logo.png', CURRENT_TIMESTAMP)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = EXCLUDED.updated_at;
```

After the existing Compose `up` succeeds, apply the SQL and wait for the restarted application:

```bash
docker exec -i sub2api-postgres psql -U sub2api -d sub2api <"$deploy_dir/quotajet-brand.sql"
docker restart sub2api >/dev/null

for _ in $(seq 1 30); do
  if [[ "$(docker inspect --format '{{.State.Health.Status}}' sub2api)" == "healthy" ]]; then
    break
  fi
  sleep 2
done

test "$(docker inspect --format '{{.State.Health.Status}}' sub2api)" = "healthy"
```

- [ ] **Step 4: Verify deployment contract and SQL idempotence**

Run the shell test locally, then apply the SQL twice to a disposable PostgreSQL container or the test deployment and assert exactly two matching rows remain.

Expected: shell test PASS; repeated SQL application leaves `site_name=QuotaJet` and `site_logo=/logo.png` with no duplicate keys.

- [ ] **Step 5: Commit deployment brand sync**

```bash
git add deploy/quotajet-brand.sql deploy/quotajet-deploy.sh deploy/tests/quotajet-deploy-test.sh
git commit -m "feat: persist QuotaJet deployment brand"
```

### Task 5: Full Verification And Test Deployment

**Files:**
- Verify only: all files changed in Tasks 1-4.

**Interfaces:**
- Consumes: completed brand commits and existing GitHub Actions deployment workflow.
- Produces: healthy branded test deployment and evidence that production is untouched.

- [ ] **Step 1: Run local focused and broad checks**

Run from `frontend/`:

```bash
pnpm exec vitest run src/__tests__/brandMetadata.spec.ts src/router/__tests__/title.spec.ts src/stores/__tests__/app.spec.ts
pnpm run type-check
```

Run from `backend/`:

```bash
go test -tags=unit ./internal/service -count=1
```

Run from the repository root:

```bash
bash deploy/tests/quotajet-deploy-test.sh
```

Expected: all commands exit 0.

- [ ] **Step 2: Verify Docker build configuration**

Run on the test server checkout:

```bash
docker compose --project-name quotajet-sub2api \
  -f deploy/docker-compose.local.yml \
  -f deploy/docker-compose.quotajet.yml config --quiet
```

Expected: exit 0.

- [ ] **Step 3: Merge or fast-forward to main and let CI deploy**

Push the reviewed commits to `main` using the established repository workflow. Wait for `CI`, `Security Scan`, and `Deploy QuotaJet Test` to complete successfully.

- [ ] **Step 4: Verify runtime and public metadata**

Verify:

```bash
curl -fsS https://sub.quotajet.com/health
curl -fsS https://sub.quotajet.com/ | grep -q '<title>QuotaJet</title>'
curl -fsS https://sub.quotajet.com/logo.png | sha256sum
```

Expected: health JSON is `{"status":"ok"}`, title is QuotaJet, and Logo hash is `b4b0fa9bbc1bd2b074029d23db61a9b47fb0430626f24ab4f769af87bd04dc0c`.

- [ ] **Step 5: Verify persisted settings and production isolation**

Query only the test database and confirm:

```sql
SELECT key, value FROM settings
WHERE key IN ('site_name', 'site_logo')
ORDER BY key;
```

Expected values: `/logo.png` and `QuotaJet`. Confirm no commands changed production `quotajet.com` DNS, Nginx, or NEWAPI containers.

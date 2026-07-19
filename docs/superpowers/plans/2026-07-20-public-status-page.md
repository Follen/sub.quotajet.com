# Public Status Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public `/status` page backed by Sub2API's existing channel-monitor results without exposing monitor secrets or creating a second probe scheduler.

**Architecture:** `ChannelMonitorRunner` remains the only upstream probe path. A new unauthenticated `GET /api/v1/status` handler converts `ChannelMonitorService.ListUserView()` into a sanitized snapshot, and a Vue public page renders that snapshot using the existing Home Header and pricing visual tokens.

**Tech Stack:** Go 1.22+, Gin, Ent repository/service layer, Vue 3, TypeScript, Vue Router, vue-i18n, Vitest, Bun.

## Global Constraints

- Reuse `ChannelMonitorService.ListUserView()` and persisted monitor history; never trigger probes from the public request.
- Return enabled monitors only.
- Never expose API keys, encrypted keys, monitor endpoints, headers, request overrides, creator IDs, or scheduler configuration.
- Keep authenticated `/monitor` and administrator monitor configuration behavior unchanged.
- Public UI text must use the existing i18n system.
- Use Bun for frontend commands.

---

### Task 1: Public Status Snapshot API

**Files:**
- Modify: `backend/internal/handler/channel_monitor_user_handler.go`
- Modify: `backend/internal/server/routes/public.go`
- Modify: `backend/internal/server/router.go`
- Modify: `backend/internal/server/routes/public_test.go`
- Test: `backend/internal/handler/channel_monitor_public_handler_test.go`

**Interfaces:**
- Consumes: `(*service.ChannelMonitorService).ListUserView(context.Context) ([]*service.UserMonitorView, error)`
- Produces: `(*ChannelMonitorUserHandler).PublicStatus(*gin.Context)` and unauthenticated `GET /api/v1/status`

- [ ] **Step 1: Write the failing public route test**

Add a test handler to `public_test.go` and assert the route is callable without JWT middleware:

```go
func TestRegisterPublicRoutesExposesStatusWithoutAuth(t *testing.T) {
    gin.SetMode(gin.TestMode)
    router := gin.New()
    v1 := router.Group("/api/v1")
    RegisterPublicRoutes(v1, func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"overall": "operational"})
    })

    recorder := httptest.NewRecorder()
    request := httptest.NewRequest(http.MethodGet, "/api/v1/status", nil)
    router.ServeHTTP(recorder, request)

    require.Equal(t, http.StatusOK, recorder.Code)
    assert.Contains(t, recorder.Body.String(), `"overall":"operational"`)
}
```

- [ ] **Step 2: Run the route test and verify it fails**

Run:

```powershell
cd backend
go test ./internal/server/routes -run TestRegisterPublicRoutesExposesStatusWithoutAuth -count=1
```

Expected: FAIL because `RegisterPublicRoutes` does not accept a status handler and `/api/v1/status` is not registered.

- [ ] **Step 3: Add the public snapshot response and handler test**

Define the response types in `channel_monitor_user_handler.go`:

```go
type channelMonitorPublicSnapshot struct {
    GeneratedAt string                       `json:"generated_at"`
    Overall     string                       `json:"overall"`
    Items       []channelMonitorUserListItem `json:"items"`
}

func publicMonitorOverall(items []channelMonitorUserListItem) string {
    if len(items) == 0 {
        return "unknown"
    }
    known := false
    for _, item := range items {
        switch item.PrimaryStatus {
        case service.MonitorStatusOperational:
            known = true
        case "":
        default:
            return "degraded"
        }
    }
    if !known {
        return "unknown"
    }
    return "operational"
}
```

The handler must return an empty successful snapshot when monitoring is disabled and otherwise reuse `ListUserView`:

```go
func (h *ChannelMonitorUserHandler) PublicStatus(c *gin.Context) {
    snapshot := channelMonitorPublicSnapshot{
        GeneratedAt: time.Now().UTC().Format(time.RFC3339),
        Overall:     "unknown",
        Items:       []channelMonitorUserListItem{},
    }
    c.Header("Cache-Control", "no-cache")
    if !h.featureEnabled(c) {
        response.Success(c, snapshot)
        return
    }
    views, err := h.monitorService.ListUserView(c.Request.Context())
    if err != nil {
        response.ErrorFrom(c, err)
        return
    }
    for _, view := range views {
        snapshot.Items = append(snapshot.Items, userMonitorViewToItem(view))
    }
    snapshot.Overall = publicMonitorOverall(snapshot.Items)
    response.Success(c, snapshot)
}
```

Add deterministic table tests for `publicMonitorOverall` covering empty, operational, degraded, failed, error, and missing status. Marshal `channelMonitorPublicSnapshot` and assert it does not contain `api_key`, `endpoint`, `extra_headers`, `body_override`, or `created_by`.

- [ ] **Step 4: Register the handler without authentication**

Change `RegisterPublicRoutes` to accept an optional handler while preserving existing tests:

```go
func RegisterPublicRoutes(v1 *gin.RouterGroup, statusHandlers ...gin.HandlerFunc) {
    v1.GET("/landing/metrics", handler.GetLandingMetrics)
    if len(statusHandlers) > 0 && statusHandlers[0] != nil {
        v1.GET("/status", statusHandlers[0])
    }
}
```

In `backend/internal/server/router.go` pass the sanitized public handler:

```go
routes.RegisterPublicRoutes(v1, h.ChannelMonitor.PublicStatus)
```

- [ ] **Step 5: Run backend tests**

Run:

```powershell
cd backend
go test ./internal/handler ./internal/server/routes -count=1
```

Expected: PASS.

- [ ] **Step 6: Commit the backend endpoint**

```powershell
git add backend/internal/handler/channel_monitor_user_handler.go backend/internal/handler/channel_monitor_public_handler_test.go backend/internal/server/routes/public.go backend/internal/server/routes/public_test.go backend/internal/server/router.go
git commit -m "feat: expose public channel status snapshot"
```

---

### Task 2: Public Status API Client And Route

**Files:**
- Modify: `frontend/src/api/channelMonitor.ts`
- Modify: `frontend/src/router/index.ts`
- Test: `frontend/src/router/__tests__/status-route.spec.ts`

**Interfaces:**
- Consumes: `GET /api/v1/status`
- Produces: `PublicStatusSnapshot`, `getPublicStatus(options?)`, and public route named `PublicStatus`

- [ ] **Step 1: Write the failing route test**

Create `status-route.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import router from '@/router'

describe('public status route', () => {
  it('is reachable without authentication', () => {
    const route = router.resolve('/status')
    expect(route.name).toBe('PublicStatus')
    expect(route.meta.requiresAuth).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
cd frontend
bun run test -- --run src/router/__tests__/status-route.spec.ts
```

Expected: FAIL because `/status` is unresolved.

- [ ] **Step 3: Add the API contract**

Extend `channelMonitor.ts`:

```ts
export interface PublicStatusSnapshot {
  generated_at: string
  overall: 'operational' | 'degraded' | 'unknown' | string
  items: UserMonitorView[]
}

export async function getPublicStatus(options?: { signal?: AbortSignal }): Promise<PublicStatusSnapshot> {
  const { data } = await apiClient.get<PublicStatusSnapshot>('/status', {
    signal: options?.signal,
  })
  return data
}
```

Add `getPublicStatus` to `channelMonitorUserAPI`.

- [ ] **Step 4: Register the public route**

Add this route next to `/pricing`:

```ts
{
  path: '/status',
  name: 'PublicStatus',
  component: () => import('@/views/user/PublicStatusView.vue'),
  meta: {
    requiresAuth: false,
    title: 'Service Status',
    titleKey: 'publicStatus.title',
  },
},
```

- [ ] **Step 5: Run the route test**

Run:

```powershell
bun run test -- --run src/router/__tests__/status-route.spec.ts
```

Expected: PASS after the view file is added in Task 3; until then typecheck may report the missing module.

---

### Task 3: Public Status Page UI

**Files:**
- Create: `frontend/src/views/user/PublicStatusView.vue`
- Create: `frontend/src/components/status/PublicStatusPage.vue`
- Create: `frontend/src/components/status/PublicStatusRow.vue`
- Create: `frontend/src/styles/status.css`
- Modify: `frontend/src/components/home/HomeHeader.vue`
- Modify: `frontend/src/i18n/locales/en/misc.ts`
- Modify: `frontend/src/i18n/locales/zh/misc.ts`
- Test: `frontend/src/components/status/__tests__/PublicStatusPage.spec.ts`
- Test: `frontend/src/views/__tests__/PublicStatusView.spec.ts`

**Interfaces:**
- Consumes: `getPublicStatus()` and `PublicStatusSnapshot`
- Produces: public status screen with no authenticated layout or monitor-management controls

- [ ] **Step 1: Write failing component tests**

Mount `PublicStatusPage` with a snapshot containing two groups and assert:

```ts
expect(wrapper.get('[data-testid="public-status-overall"]').text()).toContain('All systems operational')
expect(wrapper.findAll('[data-testid="public-status-row"]')).toHaveLength(2)
expect(wrapper.text()).toContain('OpenAI')
expect(wrapper.text()).toContain('gpt-5.4')
expect(wrapper.text()).toContain('99.95%')
expect(wrapper.find('[data-testid="admin-monitor-action"]').exists()).toBe(false)
```

Add empty and error tests asserting `publicStatus.empty` and `publicStatus.error` copy.

- [ ] **Step 2: Run the tests and verify they fail**

Run:

```powershell
bun run test -- --run src/components/status/__tests__/PublicStatusPage.spec.ts src/views/__tests__/PublicStatusView.spec.ts
```

Expected: FAIL because the page and components do not exist.

- [ ] **Step 3: Implement the presentational page**

`PublicStatusPage.vue` accepts snapshot/loading/error and emits retry:

```ts
const props = defineProps<{
  snapshot: PublicStatusSnapshot | null
  loading: boolean
  errorMessage: string
  countdown: number
}>()
defineEmits<{ retry: [] }>()

const groups = computed(() => {
  const grouped = new Map<string, UserMonitorView[]>()
  for (const item of props.snapshot?.items ?? []) {
    const name = item.group_name.trim() || item.name
    grouped.set(name, [...(grouped.get(name) ?? []), item])
  }
  return [...grouped.entries()].map(([name, items]) => ({ name, items }))
})
```

Render the hero, loading skeleton, retryable error, empty state, grouped rows, generated time, and countdown. Map `operational` to green, `degraded` to amber, `failed/error` to red, and missing history to neutral gray.

`PublicStatusRow.vue` displays `item.name`, provider, `primary_model`, `primary_latency_ms`, `availability_7d.toFixed(2) + '%'`, and up to the existing timeline point count as accessible status bars.

- [ ] **Step 4: Implement the data-owning view**

`PublicStatusView.vue` uses the same public shell as pricing:

```ts
const snapshot = ref<PublicStatusSnapshot | null>(null)
const loading = ref(true)
const errorMessage = ref('')
const countdown = ref(60)

async function reload(silent = false) {
  if (!silent) loading.value = true
  try {
    snapshot.value = await getPublicStatus()
    errorMessage.value = ''
    countdown.value = 60
  } catch (error) {
    if (!snapshot.value) errorMessage.value = extractApiErrorMessage(error, t('publicStatus.error'))
  } finally {
    loading.value = false
  }
}
```

Start a one-second countdown on mount, call `reload(true)` when it reaches zero, and clear the interval on unmount. Render `HomeHeader` with `public-catalog` and `PublicStatusPage` inside `qj-landing qj-pricing`.

- [ ] **Step 5: Add localized copy and styles**

Add the same `publicStatus` key object to English and Chinese locale files with keys for title, current network state, operational, degraded, unknown, availability, latency, last check, next update, empty, error, and retry.

Create `status.css` using existing `--pricing-*` variables. Use a constrained `max-width: 1280px`, 8px-or-less card radii, a two-column monitor row on desktop, stacked layout on mobile, and stable bar dimensions so timeline state changes do not shift layout.

- [ ] **Step 6: Point the public Header to `/status`**

Change only the `publicCatalog` navigation entry:

```ts
{ labelKey: 'Status check', href: '/status', external: false },
```

Leave the regular landing-page navigation contract unchanged.

- [ ] **Step 7: Run frontend verification**

Run:

```powershell
cd frontend
bun run lint:check
bun run typecheck
bun run test -- --run src/components/status/__tests__/PublicStatusPage.spec.ts src/views/__tests__/PublicStatusView.spec.ts src/router/__tests__/status-route.spec.ts src/views/__tests__/HomeView.spec.ts
bun run build
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit the frontend page**

```powershell
git add frontend/src/api/channelMonitor.ts frontend/src/router/index.ts frontend/src/views/user/PublicStatusView.vue frontend/src/components/status frontend/src/styles/status.css frontend/src/components/home/HomeHeader.vue frontend/src/i18n/locales/en/misc.ts frontend/src/i18n/locales/zh/misc.ts frontend/src/router/__tests__/status-route.spec.ts frontend/src/views/__tests__/PublicStatusView.spec.ts
git commit -m "feat: add public channel status page"
```

---

### Task 4: Integration Verification And Deployment

**Files:**
- Verify only; no expected source changes

**Interfaces:**
- Consumes: committed backend and frontend tasks
- Produces: deployed public status page verified against production data

- [ ] **Step 1: Run repository checks**

```powershell
git diff --check
git status --short
cd backend
go test ./internal/handler ./internal/server/routes ./internal/service -count=1
cd ../frontend
bun run lint:check
bun run typecheck
bun run build
```

Expected: all commands exit 0 and the worktree contains only intentional commits.

- [ ] **Step 2: Push main and wait for CI**

```powershell
git push origin main
gh run list --repo Follen/sub.quotajet.com --branch main --limit 10 --json databaseId,name,status,conclusion,headSha,url
```

Wait for CI, Security Scan, and Deploy QuotaJet Test to complete successfully for the pushed SHA.

- [ ] **Step 3: Verify production API**

```powershell
Invoke-RestMethod https://sub.quotajet.com/api/v1/status | ConvertTo-Json -Depth 8
```

Confirm HTTP 200, `overall`, `generated_at`, and sanitized `items`; confirm the payload contains no secret/configuration fields.

- [ ] **Step 4: Verify production UI**

Open `https://sub.quotajet.com/status` at desktop and mobile widths. Confirm the public Header, overall state, grouped monitor rows, timeline bars, availability, automatic refresh, empty/error behavior, and absence of authenticated sidebar/admin controls. Confirm Header status navigation reaches the internal page.

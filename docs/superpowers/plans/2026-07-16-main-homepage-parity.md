# Main Homepage Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the default Sub2API public homepage with a native Vue 3 port of the QuotaJet main homepage, including the code-level Three.js liquid-metal scene and matching landing metrics.

**Architecture:** Keep `HomeView.vue` as the route coordinator and preserve its custom `home_content` override. The default branch composes focused Vue homepage components, reads public settings and auth state from the existing Pinia stores, fetches decorative metrics from a new unauthenticated Go endpoint, and owns the Three.js lifecycle inside `RelayMachineVisual.vue`. All source assets are copied into the target repository, so the build has no sibling-repository dependency.

**Tech Stack:** Go 1.26.5, Gin, Vue 3, TypeScript 5.6, Vite 5, Tailwind CSS 3, Pinia, vue-i18n, Vitest, Three.js, pnpm 9.

## Global Constraints

- Main-site source of truth: `D:\Code\QuotaJet.com\QuotaJet.com`.
- Target repository: `D:\Code\QuotaJet.com\sub.quotajet.com`.
- Homepage only; do not implement the native Status page in this plan.
- Keep Status linked to `https://status.quotajet.com/`.
- Do not change `quotajet.com`, its DNS, Nginx configuration, or NEWAPI deployment.
- Copy required assets into the target repository; do not add runtime or build-time sibling paths.
- Signed-out primary actions route to `/register`; signed-in primary actions route to `/dashboard`.
- Docs links use sanitized `doc_url` and disappear when no safe value exists.
- Privacy Policy appears only when public settings contain a legal document whose ID is `privacy`.
- Preserve the existing custom `home_content` iframe/HTML override behavior.
- The normal-motion Three.js scene must preserve the main-site scene graph, geometry, material parameters, renderer values, camera, lighting, animation math, pointer behavior, HDR asset, and cleanup behavior.
- Only React ref/effect wiring may be translated to Vue lifecycle APIs; do not replace the 3D scene with an approximation.
- Reduced-motion mode disables nonessential continuous animation while leaving all content and interactions usable.
- Use existing Vue, Pinia, Tailwind, theme, locale, URL sanitization, and `@lobehub/icons` facilities.
- Use pnpm; do not add a second animation framework.
- Keep CSS letter spacing at `0`; reproduce hierarchy through type size, weight, width, and spacing.
- Do not create runtime imports from `D:\Code\QuotaJet.com\QuotaJet.com`.

## File Map

- `backend/internal/handler/landing_metrics.go`: deterministic landing metric calculation and public handler.
- `backend/internal/handler/landing_metrics_test.go`: epoch, growth, monotonicity, and response tests.
- `backend/internal/server/routes/public.go`: unauthenticated `/api/v1/landing/metrics` registration.
- `backend/internal/server/routes/public_test.go`: public route contract test.
- `backend/internal/server/router.go`: call `RegisterPublicRoutes` for the existing `/api/v1` group.
- `frontend/src/api/landing.ts`: typed metrics request through the existing Axios client.
- `frontend/src/types/landing.ts`: landing metric and display types.
- `frontend/src/composables/useLandingMetrics.ts`: fallback, ticking, fetch, and cleanup.
- `frontend/src/composables/__tests__/useLandingMetrics.spec.ts`: timing and API-failure behavior.
- `frontend/src/components/home/relayMachineMath.ts`: exact pure geometry-motion helper math from the main site.
- `frontend/src/components/home/RelayMachineVisual.vue`: exact Three.js scene port and lifecycle owner.
- `frontend/src/components/home/__tests__/RelayMachineVisual.spec.ts`: scene configuration, reduced-motion, events, and disposal.
- `frontend/src/components/home/HomeHeader.vue`: public nav, locale, theme, announcements, docs, Status, and auth actions.
- `frontend/src/components/home/HomeHero.vue`: hero copy, CTAs, metrics, and 3D placement.
- `frontend/src/components/home/HomeMetrics.vue`: three live metric cells.
- `frontend/src/components/home/PrivacyFeature.vue`: privacy section and visual.
- `frontend/src/components/home/ModelRoutingFeature.vue`: model-routing section and model constellation.
- `frontend/src/components/home/CostVisibilityFeature.vue`: cost comparison section and visual.
- `frontend/src/components/home/ReliabilityFeature.vue`: reliability section and visual.
- `frontend/src/components/home/ToolsMarquee.vue`: continuously scrolling tool compatibility strip.
- `frontend/src/components/home/HomeCallToAction.vue`: final CTA.
- `frontend/src/components/home/HomeFooter.vue`: QuotaJet footer and conditional legal links.
- `frontend/src/components/home/HomeBrandIcon.vue`: Vue SVG renderer for source model/tool logo path data.
- `frontend/src/components/home/homeContent.ts`: ordered model/tool logo metadata and shared icon-name union.
- `frontend/src/components/home/useLandingReveal.ts`: section reveal observer and reduced-motion fallback.
- `frontend/src/components/home/index.ts`: component exports.
- `frontend/src/styles/home.css`: copied and Vue-adapted landing variables, visuals, animation, responsive, and reduced-motion rules.
- `frontend/src/views/HomeView.vue`: custom-content branch plus default homepage composition.
- `frontend/src/views/__tests__/HomeView.spec.ts`: section order, routes, settings, auth, theme, and custom-content integration.
- `frontend/src/i18n/locales/en/landing.ts`: exact English landing copy.
- `frontend/src/i18n/locales/zh/landing.ts`: exact Chinese landing copy.
- `frontend/public/assets/empty_warehouse_01_1k.hdr`: copied HDR environment map.
- `frontend/package.json` and `frontend/pnpm-lock.yaml`: `three` and TypeScript declarations.
- `Makefile`: add homepage Vitest files to the critical frontend suite.
- `.github/workflows/backend-ci.yml`: run the production frontend build after frontend checks.

---

### Task 1: Add Public Landing Metrics

**Files:**
- Create: `backend/internal/handler/landing_metrics.go`
- Create: `backend/internal/handler/landing_metrics_test.go`
- Create: `backend/internal/server/routes/public.go`
- Create: `backend/internal/server/routes/public_test.go`
- Modify: `backend/internal/server/router.go:108-117`

**Interfaces:**
- Produces: `handler.GetLandingMetrics(c *gin.Context)`.
- Produces: JSON data fields `total_requests`, `total_users`, `stable_uptime_seconds`, and `generated_at`.
- Produces: unauthenticated `GET /api/v1/landing/metrics`.

- [ ] **Step 1: Write failing metric calculation tests**

```go
func TestBuildLandingMetricsAtEpoch(t *testing.T) {
	metrics := buildLandingMetrics(time.Unix(landingMetricsEpochUnix, 0).UTC())
	require.Equal(t, int64(48219037), metrics.TotalRequests)
	require.Equal(t, int64(18287), metrics.TotalUsers)
	require.Equal(t, int64(8553900), metrics.StableUptimeSeconds)
	require.Equal(t, landingMetricsEpochUnix, metrics.GeneratedAt)
}

func TestBuildLandingMetricsUsesFiveMinuteBuckets(t *testing.T) {
	metrics := buildLandingMetrics(time.Unix(landingMetricsEpochUnix+600, 0).UTC())
	require.Equal(t, int64(48219037+600*13+23+24), metrics.TotalRequests)
	require.Equal(t, int64(18287+600/72+1+2), metrics.TotalUsers)
	require.Equal(t, int64(8553900+600), metrics.StableUptimeSeconds)
}

func TestBuildLandingMetricsClampsPreEpochTime(t *testing.T) {
	metrics := buildLandingMetrics(time.Unix(landingMetricsEpochUnix-60, 0).UTC())
	require.Equal(t, int64(48219037), metrics.TotalRequests)
	require.Equal(t, int64(18287), metrics.TotalUsers)
	require.Equal(t, int64(8553900), metrics.StableUptimeSeconds)
}
```

- [ ] **Step 2: Run the handler tests and confirm failure**

Run: `cd backend && go test ./internal/handler -run 'TestBuildLandingMetrics' -count=1`

Expected: FAIL because `buildLandingMetrics` and the landing constants do not exist.

- [ ] **Step 3: Implement the deterministic metric builder and handler**

```go
const (
	landingMetricsEpochUnix     int64 = 1782496800
	landingMetricBucketSeconds  int64 = 300
	landingMetricRequestBase    int64 = 48219037
	landingMetricUserBase       int64 = 18287
	landingMetricUptimeBaseSecs int64 = 99*24*60*60 + 5*60
)

type landingMetricsResponse struct {
	TotalRequests       int64 `json:"total_requests"`
	TotalUsers          int64 `json:"total_users"`
	StableUptimeSeconds int64 `json:"stable_uptime_seconds"`
	GeneratedAt         int64 `json:"generated_at"`
}

func GetLandingMetrics(c *gin.Context) {
	response.Success(c, buildLandingMetrics(time.Now().UTC()))
}

func buildLandingMetrics(now time.Time) landingMetricsResponse {
	nowUnix := now.Unix()
	elapsed := nowUnix - landingMetricsEpochUnix
	if elapsed < 0 {
		elapsed = 0
	}
	bucket := elapsed / landingMetricBucketSeconds
	return landingMetricsResponse{
		TotalRequests:       landingMetricRequestBase + elapsed*13 + bucketedGrowth(bucket, 41, 23),
		TotalUsers:          landingMetricUserBase + elapsed/72 + bucketedGrowth(bucket, 3, 1),
		StableUptimeSeconds: landingMetricUptimeBaseSecs + elapsed,
		GeneratedAt:         nowUnix,
	}
}

func bucketedGrowth(bucket, modulus, minimum int64) int64 {
	if bucket <= 0 {
		return 0
	}
	cycles := bucket / modulus
	remainder := bucket % modulus
	return cycles*(modulus*minimum+(modulus-1)*modulus/2) +
		remainder*minimum + remainder*(remainder+1)/2
}
```

- [ ] **Step 4: Write the failing public route test**

```go
func TestRegisterPublicRoutesExposesLandingMetricsWithoutAuth(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	v1 := router.Group("/api/v1")
	RegisterPublicRoutes(v1)

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/api/v1/landing/metrics", nil)
	router.ServeHTTP(recorder, request)

	require.Equal(t, http.StatusOK, recorder.Code)
	var body struct {
		Code int `json:"code"`
		Data struct {
			TotalRequests       int64 `json:"total_requests"`
			TotalUsers          int64 `json:"total_users"`
			StableUptimeSeconds int64 `json:"stable_uptime_seconds"`
			GeneratedAt         int64 `json:"generated_at"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &body))
	require.Equal(t, 0, body.Code)
	assert.GreaterOrEqual(t, body.Data.TotalRequests, int64(48219037))
	assert.GreaterOrEqual(t, body.Data.TotalUsers, int64(18287))
	assert.GreaterOrEqual(t, body.Data.StableUptimeSeconds, int64(8553900))
	assert.GreaterOrEqual(t, body.Data.GeneratedAt, int64(1782496800))
}
```

- [ ] **Step 5: Register the public route**

```go
func RegisterPublicRoutes(v1 *gin.RouterGroup) {
	v1.GET("/landing/metrics", handler.GetLandingMetrics)
}
```

Add this call immediately after creating `v1` in `registerRoutes`:

```go
routes.RegisterPublicRoutes(v1)
```

- [ ] **Step 6: Run focused backend tests**

Run: `cd backend && go test ./internal/handler ./internal/server/routes -run 'LandingMetrics|RegisterPublicRoutes' -count=1`

Expected: PASS.

- [ ] **Step 7: Commit the backend endpoint**

```bash
git add backend/internal/handler/landing_metrics.go backend/internal/handler/landing_metrics_test.go backend/internal/server/routes/public.go backend/internal/server/routes/public_test.go backend/internal/server/router.go
git commit -m "feat: add public landing metrics"
```

---

### Task 2: Add Frontend Metrics Data Flow

**Files:**
- Create: `frontend/src/types/landing.ts`
- Create: `frontend/src/api/landing.ts`
- Create: `frontend/src/composables/useLandingMetrics.ts`
- Create: `frontend/src/composables/__tests__/useLandingMetrics.spec.ts`

**Interfaces:**
- Consumes: `GET /api/v1/landing/metrics` from Task 1.
- Produces: `LandingMetrics`, `LandingMetricDisplay`, `getLandingMetrics()`, `formatUptime()`, and `useLandingMetrics()`.

- [ ] **Step 1: Write failing fallback and server-clock tests**

```ts
describe('useLandingMetrics', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-16T00:00:00Z'))
  })

  it('shows approved baselines when the endpoint fails', async () => {
    vi.mocked(getLandingMetrics).mockRejectedValue(new Error('offline'))
    const { display, start, stop } = useLandingMetrics()
    await start()
    expect(display.value).toEqual({
      requests: '48,219,037',
      users: '18,287',
      uptime: '99d 0h 05m',
    })
    stop()
  })

  it('advances from server generated_at instead of request completion time', async () => {
    vi.mocked(getLandingMetrics).mockResolvedValue({
      total_requests: 50000000,
      total_users: 20000,
      stable_uptime_seconds: 86400,
      generated_at: Math.floor(Date.now() / 1000) - 10,
    })
    const { display, start, stop } = useLandingMetrics()
    await start()
    expect(display.value.requests).toBe('50,000,130')
    expect(display.value.uptime).toBe('1d 0h 00m')
    stop()
  })
})
```

- [ ] **Step 2: Run the composable test and confirm failure**

Run: `pnpm --dir frontend exec vitest run src/composables/__tests__/useLandingMetrics.spec.ts`

Expected: FAIL because the landing API and composable do not exist.

- [ ] **Step 3: Add exact frontend contracts and API call**

```ts
export interface LandingMetrics {
  total_requests: number
  total_users: number
  stable_uptime_seconds: number
  generated_at: number
}

export interface LandingMetricDisplay {
  requests: string
  users: string
  uptime: string
}
```

```ts
export async function getLandingMetrics(): Promise<LandingMetrics> {
  const { data } = await apiClient.get<LandingMetrics>('/landing/metrics')
  return data
}
```

- [ ] **Step 4: Implement ticking, fallback, and cleanup**

```ts
const METRIC_BASELINE: LandingMetrics = {
  total_requests: 48219037,
  total_users: 18287,
  stable_uptime_seconds: 8553900,
  generated_at: 0,
}

export function formatUptime(totalSeconds: number): string {
  const totalMinutes = Math.floor(totalSeconds / 60)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  return `${days}d ${hours}h ${String(minutes).padStart(2, '0')}m`
}

export function useLandingMetrics() {
  const serverMetrics = ref<LandingMetrics | null>(null)
  const tick = ref(0)
  let timer: number | undefined

  const elapsed = computed(() => {
    const generatedAt = serverMetrics.value?.generated_at ?? 0
    return generatedAt > 0
      ? Math.max(0, Math.floor(Date.now() / 1000) - generatedAt)
      : tick.value
  })

  const display = computed<LandingMetricDisplay>(() => {
    const base = serverMetrics.value ?? METRIC_BASELINE
    return {
      requests: (base.total_requests + elapsed.value * 13).toLocaleString('en-US'),
      users: (base.total_users + Math.floor(elapsed.value / 72)).toLocaleString('en-US'),
      uptime: formatUptime(base.stable_uptime_seconds + elapsed.value),
    }
  })

  async function start() {
    timer = window.setInterval(() => { tick.value += 1 }, 1000)
    try {
      serverMetrics.value = await getLandingMetrics()
      tick.value = 0
    } catch {
      serverMetrics.value = null
    }
  }

  function stop() {
    if (timer !== undefined) window.clearInterval(timer)
    timer = undefined
  }

  return { display, start, stop }
}
```

- [ ] **Step 5: Run the metrics tests**

Run: `pnpm --dir frontend exec vitest run src/composables/__tests__/useLandingMetrics.spec.ts`

Expected: PASS with no pending fake timers after `stop()`.

- [ ] **Step 6: Commit the frontend metric layer**

```bash
git add frontend/src/types/landing.ts frontend/src/api/landing.ts frontend/src/composables/useLandingMetrics.ts frontend/src/composables/__tests__/useLandingMetrics.spec.ts
git commit -m "feat: add landing metric client"
```

---

### Task 3: Port the Three.js Scene at Code Level

**Files:**
- Create: `frontend/src/components/home/relayMachineMath.ts`
- Create: `frontend/src/components/home/RelayMachineVisual.vue`
- Create: `frontend/src/components/home/__tests__/RelayMachineVisual.spec.ts`
- Copy: `frontend/public/assets/empty_warehouse_01_1k.hdr`
- Modify: `frontend/package.json`
- Modify: `frontend/pnpm-lock.yaml`

**Source:**
- Port from `D:\Code\QuotaJet.com\QuotaJet.com\web\default\src\features\home\components\sections\hero.tsx:41` through the end of `RelayMachineVisual`.
- Copy from `D:\Code\QuotaJet.com\QuotaJet.com\web\default\public\assets\empty_warehouse_01_1k.hdr`.

**Interfaces:**
- Produces: default Vue component `RelayMachineVisual` with no props.
- Produces: `clamp`, `liquidNoise`, and `getRestCenter` pure helpers using the exact source formulas.

- [ ] **Step 1: Install Three.js and copy the HDR asset**

Run:

```powershell
pnpm --dir frontend add three
pnpm --dir frontend add -D @types/three
New-Item -ItemType Directory -Force frontend\public\assets | Out-Null
Copy-Item -LiteralPath 'D:\Code\QuotaJet.com\QuotaJet.com\web\default\public\assets\empty_warehouse_01_1k.hdr' -Destination 'frontend\public\assets\empty_warehouse_01_1k.hdr'
```

Expected: `package.json` and `pnpm-lock.yaml` change, and the copied asset size is `1672140` bytes.

- [ ] **Step 2: Write failing pure-math parity tests**

```ts
it('preserves the main-site liquid noise formula', () => {
  expect(liquidNoise(0.5, 1.25, -0.75, 2)).toBeCloseTo(
    Math.sin(0.5 * 2 + 2) * Math.cos(1.25 * 3 + 1) * Math.sin(-0.75 * 1.5 + 1.6),
    12,
  )
})

it('preserves desktop and mobile rest centers', () => {
  expect(getRestCenter({ left: 10, width: 500, height: 400 } as DOMRect, 900)).toEqual({ x: 250, y: 192 })
  expect(getRestCenter({ left: 100, width: 600, height: 500 } as DOMRect, 1440)).toEqual({ x: 980, y: 210 })
})
```

- [ ] **Step 3: Add exact scene-construction and cleanup tests**

Mock `three`, `RGBELoader`, and `BufferGeometryUtils` and assert these exact normal-motion values:

```ts
expect(PerspectiveCamera).toHaveBeenCalledWith(40, 1, 0.1, 100)
expect(camera.position.set).toHaveBeenCalledWith(0, 0, 5.9)
expect(WebGLRenderer).toHaveBeenCalledWith(expect.objectContaining({
  alpha: true,
  antialias: true,
  powerPreference: 'high-performance',
}))
expect(renderer.setPixelRatio).toHaveBeenCalledWith(Math.min(window.devicePixelRatio || 1, 2))
expect(SphereGeometry).toHaveBeenCalledWith(1.4, 64, 64)
expect(MeshPhysicalMaterial).toHaveBeenCalledWith(expect.objectContaining({
  clearcoat: 1,
  clearcoatRoughness: 0.01,
  envMapIntensity: 2.35,
  ior: 2.4,
  metalness: 0.98,
  reflectivity: 0.95,
  roughness: 0.01,
  specularIntensity: 1,
  thickness: 0.5,
  transmission: 0.1,
}))
expect(rgbeLoader.load).toHaveBeenCalledWith('/assets/empty_warehouse_01_1k.hdr', expect.any(Function))
```

After `wrapper.unmount()`, assert `ResizeObserver.disconnect`, `cancelAnimationFrame`, geometry/material/environment/PMREM disposal, renderer disposal, and all four pointer listener removals.

- [ ] **Step 4: Run the component tests and confirm failure**

Run: `pnpm --dir frontend exec vitest run src/components/home/__tests__/RelayMachineVisual.spec.ts`

Expected: FAIL because the component and helper module do not exist.

- [ ] **Step 5: Port the helper math without changing constants**

```ts
export function liquidNoise(x: number, y: number, z: number, time: number): number {
  return Math.sin(x * 2 + time) * Math.cos(y * 3 + time * 0.5) * Math.sin(z * 1.5 + time * 0.8)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function getRestCenter(rect: DOMRect, viewportWidth = window.innerWidth) {
  if (viewportWidth < 1024) return { x: rect.width * 0.5, y: rect.height * 0.48 }
  return { x: viewportWidth * 0.75 - rect.left, y: rect.height * 0.42 }
}
```

- [ ] **Step 6: Translate React lifecycle wiring to Vue without changing scene behavior**

Use this lifecycle structure and copy all source scene values and per-frame vertex math exactly into it:

```ts
const stageRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const motion = reactive({
  targetX: 0, targetY: 0, targetCx: 0, targetCy: 0, cx: 0, cy: 0,
  rotateX: 0, rotateY: 0, targetRotateX: 0, targetRotateY: 0,
  x: 0, y: 0, dragX: 0, dragY: 0, down: false,
  lastX: 0, lastY: 0, vx: 0, vy: 0,
})

onMounted(async () => {
  const [THREE, { RGBELoader }, { mergeVertices }] = await Promise.all([
    import('three'),
    import('three/examples/jsm/loaders/RGBELoader.js'),
    import('three/examples/jsm/utils/BufferGeometryUtils.js'),
  ])

  initializeScene(THREE, RGBELoader, mergeVertices)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', updatePointer)
  window.removeEventListener('pointerdown', startDrag)
  window.removeEventListener('pointerup', endDrag)
  window.removeEventListener('pointercancel', endDrag)
  observer?.disconnect()
  window.cancelAnimationFrame(frame)
  geometry?.dispose()
  material?.dispose()
  environment?.dispose()
  pmrem?.dispose()
  renderer?.dispose()
})
```

`initializeScene` is a local function in the same `<script setup>` block, not a new shared abstraction. Translate source lines `291-457` mechanically with these substitutions:

```text
stageRef.current                          -> stageRef.value
canvasRef.current                         -> canvasRef.value
motionRef.current                         -> motion
useEffect setup body                      -> onMounted body
each useEffect return cleanup             -> the single onBeforeUnmount cleanup
frame = requestAnimationFrame(render)     -> only when reducedMotion is false
reducedMotion true                        -> call resize(), deformAndRender(0), and stop
```

Keep source lines `397-441` together in local `deformAndRender(time)` and call it from the RAF callback. This preserves all three noise frequencies, amplitudes, pointer falloff, pull coefficients, rotation increments, scale values, mesh offsets, canvas transform, and renderer call without duplicating them across reduced and normal motion paths.

The Vue template must preserve the source dimensions and layers:

```vue
<div ref="stageRef" class="landing-metal-stage relative min-h-[360px] overflow-visible sm:min-h-[440px] lg:min-h-[560px]">
  <div class="absolute inset-0 landing-metal-radial" />
  <canvas ref="canvasRef" aria-hidden="true" class="landing-metal-canvas absolute left-0 top-0" />
  <div class="landing-metal-shadow absolute" />
</div>
```

- [ ] **Step 7: Run Three.js tests and typecheck**

Run:

```bash
pnpm --dir frontend exec vitest run src/components/home/__tests__/RelayMachineVisual.spec.ts
pnpm --dir frontend run typecheck
```

Expected: PASS; no unresolved `three/examples` declarations.

- [ ] **Step 8: Commit the exact 3D port**

```bash
git add frontend/package.json frontend/pnpm-lock.yaml frontend/public/assets/empty_warehouse_01_1k.hdr frontend/src/components/home/relayMachineMath.ts frontend/src/components/home/RelayMachineVisual.vue frontend/src/components/home/__tests__/RelayMachineVisual.spec.ts
git commit -m "feat: port QuotaJet relay machine scene"
```

---

### Task 4: Port Landing Sections, Visuals, and Styles

**Files:**
- Create: `frontend/src/components/home/HomeHero.vue`
- Create: `frontend/src/components/home/HomeMetrics.vue`
- Create: `frontend/src/components/home/PrivacyFeature.vue`
- Create: `frontend/src/components/home/ModelRoutingFeature.vue`
- Create: `frontend/src/components/home/CostVisibilityFeature.vue`
- Create: `frontend/src/components/home/ReliabilityFeature.vue`
- Create: `frontend/src/components/home/ToolsMarquee.vue`
- Create: `frontend/src/components/home/HomeCallToAction.vue`
- Create: `frontend/src/components/home/HomeBrandIcon.vue`
- Create: `frontend/src/components/home/homeContent.ts`
- Create: `frontend/src/components/home/useLandingReveal.ts`
- Create: `frontend/src/components/home/index.ts`
- Create: `frontend/src/components/home/__tests__/LandingSections.spec.ts`
- Create: `frontend/src/styles/home.css`

**Source Mapping:**
- `HomeHero.vue`: `web/default/src/features/home/components/sections/hero.tsx:70-149`.
- Feature components and tools: `web/default/src/features/home/components/sections/features.tsx`.
- `HomeCallToAction.vue`: `web/default/src/features/home/components/sections/cta.tsx`.
- Landing CSS: `web/default/src/styles/index.css:406-1547`, limited to selectors used by this homepage.

**Interfaces:**
- Consumes: `RelayMachineVisual` from Task 3 and `LandingMetricDisplay` from Task 2.
- Produces: section components with `data-home-section` markers in exact order.

- [ ] **Step 1: Write failing section-order and route tests**

```ts
const metrics = { requests: '48,219,037', users: '18,287', uptime: '99d 0h 05m' }

it('gives every section its stable integration marker', () => {
  expect(mount(HomeHero, { props: { isAuthenticated: false, metrics } }).get('[data-home-section]').attributes('data-home-section')).toBe('hero')
  expect(mount(PrivacyFeature, { props: { isAuthenticated: false } }).get('[data-home-section]').attributes('data-home-section')).toBe('privacy')
  expect(mount(ModelRoutingFeature, { props: { isAuthenticated: false } }).get('[data-home-section]').attributes('data-home-section')).toBe('models')
  expect(mount(CostVisibilityFeature).get('[data-home-section]').attributes('data-home-section')).toBe('pricing')
  expect(mount(ReliabilityFeature, { props: { isAuthenticated: false } }).get('[data-home-section]').attributes('data-home-section')).toBe('reliability')
  expect(mount(ToolsMarquee).get('[data-home-section]').attributes('data-home-section')).toBe('tools')
  expect(mount(HomeCallToAction, { props: { isAuthenticated: false, docUrl: '' } }).get('[data-home-section]').attributes('data-home-section')).toBe('cta')
})

it('maps signed-out and signed-in primary actions correctly', async () => {
  expect(mount(HomeHero, { props: { isAuthenticated: false, metrics } }).find('[data-primary-cta]').attributes('to')).toBe('/register')
  expect(mount(HomeHero, { props: { isAuthenticated: true, metrics } }).find('[data-primary-cta]').attributes('to')).toBe('/dashboard')
})
```

- [ ] **Step 2: Run the section test and confirm failure**

Run: `pnpm --dir frontend exec vitest run src/components/home/__tests__/LandingSections.spec.ts`

Expected: FAIL because the landing section components do not exist.

- [ ] **Step 3: Port hero and metrics composition**

`HomeHero.vue` accepts only stable integration props:

```ts
const props = defineProps<{
  isAuthenticated: boolean
  metrics: LandingMetricDisplay
}>()
```

Use `/register` or `/dashboard` for the primary CTA, `#models` for the secondary CTA, and keep the exact source content hierarchy, metric grid, industrial background, animation delays, and 3D placement. Remove source negative tracking utilities and set `letter-spacing: 0` in `home.css`.

- [ ] **Step 4: Port the four feature visuals exactly**

Each component must expose a root marker and preserve source visual DOM/SVG geometry:

```vue
<section id="privacy" data-home-section="privacy">...</section>
<section id="models" data-home-section="models">...</section>
<section id="pricing" data-home-section="pricing">...</section>
<section id="reliability" data-home-section="reliability">...</section>
```

Map the source feature data exactly:

```ts
export const modelNodes = [
  { icon: 'OpenAI.Color', label: 'OpenAI' },
  { icon: 'Claude.Color', label: 'Claude' },
  { icon: 'Gemini.Color', label: 'Gemini' },
  { icon: 'DeepSeek.Color', label: 'DeepSeek' },
  { icon: 'Qwen.Color', label: 'Qwen' },
  { icon: 'Grok.Color', label: 'Grok' },
  { icon: 'Doubao.Color', label: 'Doubao' },
  { icon: 'Moonshot.Color', label: 'Moonshot' },
  { icon: 'Zhipu.Color', label: 'GLM' },
  { icon: 'Mistral.Color', label: 'Mistral' },
]

export const toolNodes = [
  { icon: 'Codex.Color', label: 'Codex' },
  { icon: 'ClaudeCode.Color', label: 'Claude Code' },
  { icon: 'Cursor.Color', label: 'Cursor' },
  { icon: 'Cline.Color', label: 'Cline' },
  { icon: 'OpenWebUI.Color', label: 'Open WebUI' },
  { icon: 'LobeHub.Color', label: 'LobeChat' },
  { icon: 'Dify.Color', label: 'Dify' },
  { icon: 'CherryStudio.Color', label: 'Cherry Studio' },
  { icon: 'ComfyUI.Color', label: 'ComfyUI' },
  { icon: 'LangChain.Color', label: 'LangChain' },
]

export type LandingBrandIconName =
  | typeof modelNodes[number]['icon']
  | typeof toolNodes[number]['icon']
```

The installed `@lobehub/icons` package exports React components and cannot be mounted in Vue. Follow the repository's existing `ModelIcon.vue` pattern: copy the exact `viewBox`, path data, and source colors from each matching `@lobehub/icons/es/<Name>/Color.js` module into `HomeBrandIcon.vue`, render them with Vue `<svg>`/`<path>`, and cover all 20 entries above. Do not use letter badges when source path data exists.

`HomeBrandIcon.vue` accepts this contract:

```ts
const props = withDefaults(defineProps<{
  name: LandingBrandIconName
  size?: number
}>(), { size: 28 })
```

Add a table test that mounts all 20 names and asserts each result contains a nonempty SVG path and no fallback node.

- [ ] **Step 5: Port tools marquee and CTA behavior**

Duplicate the tools array once for a seamless CSS track, mark the duplicate copy `aria-hidden="true"`, stop the marquee under `prefers-reduced-motion`, use `/register` or `/dashboard` for the primary CTA, and emit the sanitized Docs URL only when provided.

- [ ] **Step 6: Add reveal behavior with reduced-motion fallback**

```ts
export function useLandingReveal(root: Ref<HTMLElement | null>) {
  let observer: IntersectionObserver | undefined
  onMounted(() => {
    const nodes = root.value?.querySelectorAll<HTMLElement>('[data-landing-reveal]') ?? []
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nodes.forEach((node) => node.dataset.visible = 'true')
      return
    }
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          ;(entry.target as HTMLElement).dataset.visible = 'true'
          observer?.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12 })
    nodes.forEach((node) => observer?.observe(node))
  })
  onBeforeUnmount(() => observer?.disconnect())
}
```

- [ ] **Step 7: Copy and adapt only the required landing styles**

Start `home.css` with the source palette and no negative letter spacing:

```css
.qj-landing {
  --landing-bg: #f4f3ee;
  --landing-fg: #171717;
  --landing-fg-soft: rgb(23 23 23 / 0.62);
  --landing-fg-muted: rgb(23 23 23 / 0.42);
  --landing-border: rgb(23 23 23 / 0.15);
  --landing-border-faint: rgb(23 23 23 / 0.08);
  --landing-surface: rgb(255 255 255 / 0.5);
  --landing-surface-soft: rgb(255 255 255 / 0.38);
  --landing-surface-strong: rgb(255 255 255 / 0.72);
  --landing-grid: rgb(17 17 17 / 0.075);
  --landing-glow-soft: rgb(0 0 0 / 0.07);
  --landing-glow-strong: rgb(31 41 55 / 0.13);
  --landing-accent: rgb(20 20 20);
  --landing-accent-contrast: rgb(255 255 255);
  --landing-shadow: rgb(0 0 0 / 0.16);
  color: var(--landing-fg);
  background: var(--landing-bg);
  letter-spacing: 0;
}

.dark .qj-landing {
  --landing-bg: #111;
  --landing-fg: #fff;
  --landing-fg-soft: rgb(255 255 255 / 0.62);
  --landing-fg-muted: rgb(255 255 255 / 0.42);
  --landing-border: rgb(255 255 255 / 0.14);
  --landing-border-faint: rgb(255 255 255 / 0.08);
  --landing-surface: rgb(255 255 255 / 0.035);
  --landing-surface-soft: rgb(255 255 255 / 0.055);
  --landing-surface-strong: rgb(255 255 255 / 0.09);
  --landing-grid: rgb(255 255 255 / 0.05);
  --landing-glow-soft: rgb(255 255 255 / 0.08);
  --landing-glow-strong: rgb(255 255 255 / 0.11);
  --landing-accent: rgb(255 255 255);
  --landing-accent-contrast: rgb(17 17 17);
  --landing-shadow: rgb(0 0 0 / 0.54);
}

@media (prefers-reduced-motion: reduce) {
  .qj-landing *, .qj-landing *::before, .qj-landing *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 1ms !important;
  }
}
```

Port the exact keyframes and selectors referenced by the Vue templates from source lines `406-1547`: hero fade-up, route dash and packets, model packet motion, billing scan, orbit spins, usage pulse, stability fill/packet, price fill, privacy redaction/line/dot, logo float/core breathe/marquee, landing palette and surfaces, model nodes/core/orbits, pricing bars, privacy streams, stability rows, metal stage/canvas/shadow, reveal states, and responsive/reduced-motion blocks. Exclude only selectors whose class name does not appear in any new Vue component.

- [ ] **Step 8: Run section tests and lint**

Run:

```bash
pnpm --dir frontend exec vitest run src/components/home/__tests__/LandingSections.spec.ts
pnpm --dir frontend run lint:check
```

Expected: PASS with no unresolved icon imports or accessibility warnings.

- [ ] **Step 9: Commit landing sections**

```bash
git add frontend/src/components/home frontend/src/styles/home.css
git commit -m "feat: port QuotaJet landing sections"
```

---

### Task 5: Integrate Header, Footer, Settings, and Localization

**Files:**
- Create: `frontend/src/components/home/HomeHeader.vue`
- Create: `frontend/src/components/home/HomeFooter.vue`
- Modify: `frontend/src/components/home/index.ts`
- Modify: `frontend/src/views/HomeView.vue`
- Modify: `frontend/src/views/__tests__/HomeView.spec.ts`
- Modify: `frontend/src/i18n/locales/en/landing.ts`
- Modify: `frontend/src/i18n/locales/zh/landing.ts`

**Source Mapping:**
- Header: `web/default/src/components/layout/components/public-header.tsx` and its public navigation.
- Footer: `web/default/src/components/layout/components/footer.tsx:73-107` and `:206-264`.
- Copy: `web/default/src/i18n/locales/en.json` and `zh.json`, nested `translation.landing` objects.

**Interfaces:**
- Consumes: `useAppStore`, `useAuthStore`, `sanitizeUrl`, `LocaleSwitcher`, and all Task 4 components.
- Produces: complete default homepage while retaining the custom-content branch.

- [ ] **Step 1: Expand failing HomeView integration tests**

Add this helper at the top of `HomeView.spec.ts` so every case uses the same router/component stubs:

```ts
function mountHome() {
  return mount(HomeView, {
    global: {
      stubs: {
        RouterLink: { props: ['to'], template: '<a :data-to="to" :href="typeof to === `string` ? to : undefined"><slot /></a>' },
        LocaleSwitcher: true,
        AnnouncementBell: true,
        RelayMachineVisual: { template: '<canvas class="landing-metal-canvas" />' },
      },
    },
  })
}
```

```ts
it('renders the full default homepage in approved order', () => {
  const wrapper = mountHome()
  expect(wrapper.findAll('[data-home-section]').map((node) => node.attributes('data-home-section'))).toEqual([
    'hero', 'privacy', 'models', 'pricing', 'reliability', 'tools', 'cta',
  ])
})

it('omits unsafe or missing docs URLs', () => {
  appStore.cachedPublicSettings = { doc_url: 'javascript:alert(1)', home_content: '' }
  expect(mountHome().find('[data-doc-link]').exists()).toBe(false)
})

it('only renders Privacy Policy when the document exists', () => {
  appStore.cachedPublicSettings = { login_agreement_documents: [{ id: 'terms', title: 'Terms', content_md: '' }], home_content: '' }
  expect(mountHome().find('a[href="/legal/privacy"]').exists()).toBe(false)
  appStore.cachedPublicSettings.login_agreement_documents.push({ id: 'privacy', title: 'Privacy', content_md: '' })
  expect(mountHome().find('a[href="/legal/privacy"]').exists()).toBe(true)
})

it('opens and closes the mobile navigation without leaving body scroll locked', async () => {
  const wrapper = mountHome()
  await wrapper.get('[data-mobile-menu-button]').trigger('click')
  expect(wrapper.get('[data-mobile-navigation]').attributes('data-open')).toBe('true')
  expect(document.body.style.overflow).toBe('hidden')
  wrapper.unmount()
  expect(document.body.style.overflow).toBe('')
})

it('preserves custom home content instead of mounting the default homepage', () => {
  appStore.cachedPublicSettings = { home_content: '<strong>Custom</strong>' }
  const wrapper = mountHome()
  expect(wrapper.html()).toContain('<strong>Custom</strong>')
  expect(wrapper.find('[data-home-section]').exists()).toBe(false)
})
```

- [ ] **Step 2: Run HomeView tests and confirm failure**

Run: `pnpm --dir frontend exec vitest run src/views/__tests__/HomeView.spec.ts`

Expected: FAIL because the old default homepage and route mappings are still present.

- [ ] **Step 3: Implement the public header contract**

```ts
const props = defineProps<{
  isAuthenticated: boolean
  docUrl: string
}>()
```

Header links:

```ts
const navigation = [
  { labelKey: 'landing.nav.models', href: '#models' },
  { labelKey: 'landing.nav.about', href: '#privacy' },
  { labelKey: 'landing.nav.status', href: 'https://status.quotajet.com/' },
]
```

Use the existing `LocaleSwitcher`, `AnnouncementBell` when authenticated, a moon/sun icon button with tooltip, an external Docs link only when `docUrl` is safe, `/login` for signed-out login, and `/dashboard` for authenticated console access. The theme button must toggle `document.documentElement.classList`, persist `theme`, and use the current class as source of truth.

Match the source header interaction: track `window.scrollY > 20` and switch from the full-width 64px header to the centered compact 48px header; show desktop links at `lg` and above; show locale, theme, authenticated profile action, and a three-line menu button below `lg`; open a full-screen mobile navigation overlay; lock `document.body.style.overflow` while open; close it on link selection and unmount. Do not port the source sign-in countdown dialog because every approved homepage nav link is public and the target auth CTA already has an explicit destination.

- [ ] **Step 4: Implement the footer contract**

Always render QuotaJet branding, `QuotaJet Model Relay`, current year, `/legal/terms`, and source copyright layout. Render `/legal/privacy` only when `hasPrivacyDocument` is true. Use `/home` for the footer logo and do not render empty Docs links.

- [ ] **Step 5: Replace only the default branch in HomeView**

```ts
const safeDocUrl = computed(() => sanitizeUrl(appStore.cachedPublicSettings?.doc_url || appStore.docUrl || ''))
const homeContent = computed(() => appStore.cachedPublicSettings?.home_content || '')
const isAuthenticated = computed(() => authStore.isAuthenticated)
const hasPrivacyDocument = computed(() =>
  appStore.cachedPublicSettings?.login_agreement_documents?.some((document) => document.id === 'privacy') === true,
)
const { display: metrics, start: startMetrics, stop: stopMetrics } = useLandingMetrics()

onMounted(async () => {
  await authStore.checkAuth()
  if (!homeContent.value) await startMetrics()
})
onBeforeUnmount(stopMetrics)
```

Default template composition:

```vue
<div v-else class="qj-landing min-h-screen overflow-x-hidden">
  <HomeHeader :is-authenticated="isAuthenticated" :doc-url="safeDocUrl" />
  <main ref="landingRoot">
    <HomeHero :is-authenticated="isAuthenticated" :metrics="metrics" />
    <PrivacyFeature :is-authenticated="isAuthenticated" />
    <ModelRoutingFeature :is-authenticated="isAuthenticated" />
    <CostVisibilityFeature />
    <ReliabilityFeature :is-authenticated="isAuthenticated" />
    <ToolsMarquee />
    <HomeCallToAction :is-authenticated="isAuthenticated" :doc-url="safeDocUrl" />
  </main>
  <HomeFooter :has-privacy-document="hasPrivacyDocument" />
</div>
```

Import `@/styles/home.css` from `HomeView.vue`. Keep the existing custom URL/HTML branch unchanged.

- [ ] **Step 6: Replace English and Chinese landing dictionaries**

Copy the complete `translation.landing` object from each main-site locale into the target `landing.ts`, then add only the header/footer keys needed by the Vue shell:

```ts
nav: {
  models: 'Models',
  docs: 'Docs',
  about: 'About',
  status: 'Status',
  login: 'Sign in',
  dashboard: 'Console',
},
footer: {
  agreement: 'User Agreement',
  privacy: 'Privacy Policy',
  copyright: 'All rights reserved.',
},
```

Provide exact Chinese counterparts in `zh/landing.ts`. Do not leave user-visible text literals in Vue templates except `QuotaJet`, product/model names, URLs, and protocol identifiers.

- [ ] **Step 7: Run integration, locale, and type checks**

Run:

```bash
pnpm --dir frontend exec vitest run src/views/__tests__/HomeView.spec.ts src/components/home/__tests__/LandingSections.spec.ts
pnpm --dir frontend run typecheck
pnpm --dir frontend run lint:check
```

Expected: PASS.

- [ ] **Step 8: Commit homepage integration**

```bash
git add frontend/src/components/home/HomeHeader.vue frontend/src/components/home/HomeFooter.vue frontend/src/components/home/index.ts frontend/src/views/HomeView.vue frontend/src/views/__tests__/HomeView.spec.ts frontend/src/i18n/locales/en/landing.ts frontend/src/i18n/locales/zh/landing.ts
git commit -m "feat: integrate QuotaJet public homepage"
```

---

### Task 6: Add CI Coverage and Perform Visual Verification

**Files:**
- Modify: `Makefile:3-9`
- Modify: `.github/workflows/backend-ci.yml:40-59`
- Test: all homepage and backend tests from Tasks 1-5.

**Interfaces:**
- Consumes: complete homepage implementation.
- Produces: CI coverage for focused homepage tests and production frontend build.

- [ ] **Step 1: Add homepage tests to the critical frontend suite**

Extend `FRONTEND_CRITICAL_VITEST`:

```make
	src/views/__tests__/HomeView.spec.ts \
	src/composables/__tests__/useLandingMetrics.spec.ts \
	src/components/home/__tests__/RelayMachineVisual.spec.ts \
	src/components/home/__tests__/LandingSections.spec.ts \
```

- [ ] **Step 2: Add the production build to CI**

After `make test-frontend` in the frontend job, add:

```yaml
      - name: Build production frontend
        run: make build-frontend
```

- [ ] **Step 3: Run focused tests first**

Run:

```bash
cd backend && go test ./internal/handler ./internal/server/routes -run 'LandingMetrics|RegisterPublicRoutes' -count=1
cd ..
pnpm --dir frontend exec vitest run src/views/__tests__/HomeView.spec.ts src/composables/__tests__/useLandingMetrics.spec.ts src/components/home/__tests__/RelayMachineVisual.spec.ts src/components/home/__tests__/LandingSections.spec.ts
```

Expected: PASS.

- [ ] **Step 4: Run repository-level verification**

Run:

```bash
make test-frontend
make build-frontend
make build-backend
cd backend && go test ./internal/handler ./internal/server/routes -count=1
cd ..
git diff --check
```

Expected: every command exits `0`; Vite emits the embedded frontend into `backend/internal/web/dist`.

- [ ] **Step 5: Start the local frontend for browser verification**

Run: `pnpm --dir frontend run dev -- --host 127.0.0.1 --port 4173`

Expected: Vite serves `http://127.0.0.1:4173/home`. API failure is allowed during this visual pass because metrics have approved fallbacks.

- [ ] **Step 6: Compare desktop and mobile screenshots**

Using the in-app browser, capture the target and `https://quotajet.com/` at:

```text
Desktop: 1440x900
Mobile: 390x844
```

Verify section order, first-viewport framing, header behavior, hero alignment, feature visuals, tools marquee, CTA, footer, light/dark themes, Chinese/English layout, no horizontal overflow, and no overlapping text. Fix mismatches in the owning component or `home.css`, then rerun Steps 3-4.

- [ ] **Step 7: Verify the WebGL canvas is nonblank and interactive**

Use Playwright in the browser session to sample canvas pixels after two animation frames:

```js
const result = await page.locator('.landing-metal-canvas').evaluate((canvas) => {
  const source = canvas
  const probe = document.createElement('canvas')
  probe.width = source.width
  probe.height = source.height
  const context = probe.getContext('2d')
  context.drawImage(source, 0, 0)
  const pixels = context.getImageData(0, 0, probe.width, probe.height).data
  let nonTransparent = 0
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] > 0) nonTransparent += 1
  }
  return { width: source.width, height: source.height, nonTransparent }
})
```

Expected: width and height are greater than `1`, and `nonTransparent` is greater than `1000`. Drag on the right half of the hero and verify the canvas frame changes; enable reduced motion and verify the canvas remains visible without a continuous RAF loop.

- [ ] **Step 8: Commit CI and final parity fixes**

```bash
git add Makefile .github/workflows/backend-ci.yml
git commit -m "test: verify homepage parity in CI"
```

If screenshot comparison required a parity correction, stage only the reviewed owning component and `frontend/src/styles/home.css` in a separate `fix: align homepage visual parity` commit before this CI commit.

- [ ] **Step 9: Push only after all checks pass**

Run: `git status --short --branch`

Expected: clean working tree and local `main` ahead of `origin/main`. Push `main`; the existing workflow deploys only after CI succeeds to `sub.quotajet.com`.

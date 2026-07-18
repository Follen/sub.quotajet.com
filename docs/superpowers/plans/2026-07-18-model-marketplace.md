# Public Model Marketplace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public OpenRouter-inspired model marketplace in the `sub2api` Vue frontend, backed by a safe public aggregation API that exposes only public channels, groups, models, prices, multipliers, and tier intervals.

**Architecture:** Add a service-level public marketplace aggregator and a dedicated unauthenticated route. Aggregate `ChannelService.ListAvailable` data after filtering inactive/exclusive groups, preserve `ChannelModelPricing.Intervals`, and return explicit public DTOs. Add a Vue marketplace view with horizontal platform tabs, model selection, detail navigation, pricing/tier panels, and Quick Start code using the existing OpenAI-compatible endpoint.

**Tech Stack:** Go 1.22+, Gin, existing service/repository layer, Vue 3 + TypeScript, Vitest, existing i18n and API client.

## Global Constraints

- The marketplace is public but must never expose private groups, user-specific rates, credentials, account health internals, or admin routing fields.
- The page is display-only; actual gateway billing remains unchanged.
- Preserve `billing_mode`, absent-vs-zero prices, group multipliers, and tier interval bounds exactly.
- All visible frontend text uses `useI18n()` and locale keys.
- Use `common.*` JSON wrappers for backend marshal/unmarshal calls.
- Add focused regression tests for public filtering, aggregation, tiers, frontend selection, and Quick Start model substitution.

---

### Task 1: Define the public marketplace aggregation contract

**Files:**
- Create: `backend/internal/service/model_marketplace.go`
- Create: `backend/internal/service/model_marketplace_test.go`
- Modify: `backend/internal/service/channel_available.go` only if a small exported conversion helper is needed

**Interfaces:**
- Consumes: `ChannelService.ListAvailable(ctx)` and `AvailableChannel` / `AvailableGroupRef` / `SupportedModel` values.
- Produces: `PublicModelMarketplaceService` and `Build(ctx)` with stable platform/model ordering and public DTO fields.

- [ ] **Step 1: Write failing service tests**

Cover these exact cases in `model_marketplace_test.go`:

```go
func TestBuildPublicModelMarketplaceFiltersExclusiveGroupsAndInactiveChannels(t *testing.T) {}
func TestBuildPublicModelMarketplaceMergesModelsAndPreservesAllPublicGroupPrices(t *testing.T) {}
func TestBuildPublicModelMarketplacePreservesTierIntervalsAndFallbackMarker(t *testing.T) {}
func TestBuildPublicModelMarketplaceSortsPlatformsModelsAndGroups(t *testing.T) {}
```

Use deterministic in-memory stubs for `ChannelService.ListAvailable`; assert that an exclusive group and its model are absent, duplicate public models merge, `Intervals` retain nullable `MaxTokens` and `TierLabel`, and no private fields appear in the result.

- [ ] **Step 2: Run the focused tests and verify the expected failure**

Run from `backend/`:

```powershell
go test ./internal/service -run TestBuildPublicModelMarketplace -count=1
```

Expected: compile/test failure because the public marketplace types and builder do not yet exist.

- [ ] **Step 3: Implement the minimal aggregator**

Define explicit public structs for platform, model, provider, group price, price fields, and tier intervals. Filter to active/non-exclusive groups before merging by `(platform, model name)`. Sort every emitted slice deterministically. Mark LiteLLM fallback-derived pricing as display-only without altering billing behavior.

- [ ] **Step 4: Run the focused tests and verify they pass**

```powershell
go test ./internal/service -run TestBuildPublicModelMarketplace -count=1
```

Expected: all marketplace service tests pass.

- [ ] **Step 5: Commit**

```powershell
git add backend/internal/service/model_marketplace.go backend/internal/service/model_marketplace_test.go backend/internal/service/channel_available.go
git commit -m "feat: aggregate public model marketplace data"
```

### Task 2: Expose the public marketplace API

**Files:**
- Create: `backend/internal/handler/model_marketplace_handler.go`
- Create: `backend/internal/handler/model_marketplace_handler_test.go`
- Modify: `backend/internal/server/routes/user.go`
- Modify: dependency wiring files if the route needs a new handler constructor

**Interfaces:**
- Consumes: `service.PublicModelMarketplaceService` from Task 1.
- Produces: `GET /api/v1/model-marketplace`, returning the stable public JSON envelope consumed by Vue.

- [ ] **Step 1: Write failing handler tests**

Add tests for unauthenticated success, public-only filtering, deterministic response shape, and service error mapping:

```go
func TestModelMarketplaceHandlerIsPublic(t *testing.T) {}
func TestModelMarketplaceHandlerReturnsPublicPayload(t *testing.T) {}
func TestModelMarketplaceHandlerMapsServiceErrors(t *testing.T) {}
```

- [ ] **Step 2: Run handler tests to verify RED**

```powershell
go test ./internal/handler -run TestModelMarketplaceHandler -count=1
```

Expected: failure because the handler and route are missing.

- [ ] **Step 3: Implement handler and route**

Register the route outside authentication middleware. Use the project response envelope and do not accept user/group query parameters that could bypass public filtering. Wire the service through the existing server dependency setup.

- [ ] **Step 4: Run handler tests and route checks**

```powershell
go test ./internal/handler ./internal/server/routes -run ModelMarketplace -count=1
```

Expected: all focused API tests pass.

- [ ] **Step 5: Commit**

```powershell
git add backend/internal/handler/model_marketplace_handler.go backend/internal/handler/model_marketplace_handler_test.go backend/internal/server/routes/user.go backend/cmd/server
git commit -m "feat: expose public model marketplace endpoint"
```

### Task 3: Add frontend API types and marketplace shell

**Files:**
- Create: `frontend/src/api/modelMarketplace.ts`
- Create: `frontend/src/views/user/ModelMarketplaceView.vue`
- Create: `frontend/src/components/model-marketplace/ModelMarketplaceShell.vue`
- Create: `frontend/src/components/model-marketplace/__tests__/ModelMarketplaceShell.spec.ts`
- Modify: `frontend/src/router/index.ts`
- Modify: `frontend/src/i18n/locales/en/*` and `frontend/src/i18n/locales/zh/*`

**Interfaces:**
- Consumes: `GET /api/v1/model-marketplace` DTOs from Task 2.
- Produces: public `/models` route, platform tabs, model selector, loading/error/empty states, and selected-model URL state.

- [ ] **Step 1: Write failing Vue tests**

Assert the shell renders platform tabs from API data, switches selected model, preserves a `model` query parameter, and shows the public empty state.

- [ ] **Step 2: Run the focused test to verify RED**

```powershell
pnpm exec vitest run src/components/model-marketplace/__tests__/ModelMarketplaceShell.spec.ts
```

Expected: failure because the API types and components are missing.

- [ ] **Step 3: Implement API types, route, shell, and i18n keys**

Use the existing `apiClient`, `AppLayout`, and `useI18n` patterns. Keep all visible labels in locale files. Use a horizontally scrollable tab row and URL query synchronization without exposing private data.

- [ ] **Step 4: Run focused frontend tests**

```powershell
pnpm exec vitest run src/components/model-marketplace/__tests__/ModelMarketplaceShell.spec.ts
```

Expected: all shell tests pass.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/api/modelMarketplace.ts frontend/src/views/user/ModelMarketplaceView.vue frontend/src/components/model-marketplace frontend/src/router/index.ts frontend/src/i18n/locales/en frontend/src/i18n/locales/zh
git commit -m "feat: add public model marketplace shell"
```

### Task 4: Implement OpenRouter-inspired details and Quick Start

**Files:**
- Create: `frontend/src/components/model-marketplace/MarketplaceDetailNav.vue`
- Create: `frontend/src/components/model-marketplace/MarketplaceModelDetails.vue`
- Create: `frontend/src/components/model-marketplace/MarketplacePricingPanel.vue`
- Create: `frontend/src/components/model-marketplace/MarketplaceTierTable.vue`
- Create: `frontend/src/components/model-marketplace/MarketplaceQuickStart.vue`
- Create: `frontend/src/components/model-marketplace/__tests__/MarketplaceDetails.spec.ts`
- Modify: `frontend/src/components/model-marketplace/ModelMarketplaceShell.vue`
- Modify: locale files from Task 3

**Interfaces:**
- Consumes: selected platform/model DTOs and the existing copy utility.
- Produces: Providers, Effective Pricing, Performance, Uptime, Benchmarks, Apps, Activity sections; real provider/pricing/tier data; honest empty states for unsupported metrics; Quick Start with selected model.

- [ ] **Step 1: Write failing component tests**

Cover provider/group rows, base vs effective price labels, tier interval rendering, empty unsupported sections, code substitution, copy action, and the authenticated key-management link.

- [ ] **Step 2: Run tests to verify RED**

```powershell
pnpm exec vitest run src/components/model-marketplace/__tests__/MarketplaceDetails.spec.ts
```

Expected: failure because detail components are missing.

- [ ] **Step 3: Implement detail components**

Use the supplied reference as the visual target: dark surfaces, lime active states, compact bordered panels, monospace code blocks, and a left detail rail. Render only fields present in the API; do not invent benchmarks or uptime values. Quick Start must use the selected model and the configured API origin, and its Create API Key action must link to the authenticated key page.

- [ ] **Step 4: Run component tests and frontend build**

```powershell
pnpm exec vitest run src/components/model-marketplace/__tests__/MarketplaceDetails.spec.ts
pnpm run build
```

Expected: focused tests pass and production build exits 0.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/components/model-marketplace frontend/src/i18n/locales/en frontend/src/i18n/locales/zh
git commit -m "feat: add model marketplace details and quick start"
```

### Task 5: Full verification and delivery

**Files:**
- Modify: focused regression tests only if verification exposes a contract gap

- [ ] **Step 1: Run backend focused and full tests**

```powershell
go test ./internal/service ./internal/handler ./internal/server/routes -count=1
go test ./... -count=1
```

- [ ] **Step 2: Run frontend focused and full tests**

```powershell
pnpm exec vitest run src/components/model-marketplace
pnpm run test:run
pnpm run build
```

- [ ] **Step 3: Review the public payload and UI manually**

Verify unauthenticated `GET /api/v1/model-marketplace`, exclusive-group exclusion, platform/model selection, tier rendering, Quick Start model substitution, keyboard focus, mobile layout, and no invented metrics.

- [ ] **Step 4: Commit any verification-only fixes**

```powershell
git add backend frontend
git commit -m "test: verify public model marketplace"
```

- [ ] **Step 5: Confirm clean status and report evidence**

```powershell
git status --short
git log -5 --oneline
```

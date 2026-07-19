# Public Status Page Design

## Goal

Add a public `/status` page to Sub2API that presents the existing channel-monitor results in the same information hierarchy as `status.quotajet.com`. The implementation must reuse Sub2API's channel monitor runner and stored history rather than creating a second probe scheduler or generating additional API keys.

## Scope

- Add a public, unauthenticated status snapshot API.
- Add a public `/status` frontend route.
- Display enabled channel monitors grouped by `group_name`.
- Show overall health, primary model, current latency, seven-day availability, and recent check history.
- Point the public Header status navigation item to `/status`.
- Preserve the existing authenticated `/monitor` route and administrator monitor configuration workflow.

The feature does not automatically create monitors, generate API keys, change monitor schedules, or expose monitor configuration secrets.

## Backend Design

### Public API

Expose `GET /api/v1/status` outside JWT middleware. The handler will reuse `ChannelMonitorService.ListUserView()` so the public response is derived from the same enabled monitors, latest results, availability aggregation, and recent history used by the authenticated monitor view.

The response contains:

- Snapshot generation time.
- Overall status derived from all enabled monitors.
- Enabled monitor entries containing ID, display name, provider, group name, primary model, current status, latency, ping latency, seven-day availability, and recent timeline points.

The response must not contain API keys, encrypted keys, monitor endpoints, custom headers, request-body overrides, creator IDs, or scheduler configuration.

### Feature Disabled

When channel monitoring is disabled, the endpoint returns a successful empty snapshot. This keeps the public page stable and avoids exposing whether configuration exists behind the disabled feature.

### Status Mapping

- Every monitor operational: `operational`.
- At least one failed, error, or degraded monitor: `degraded`.
- No enabled monitors or no completed checks: `unknown`.

Existing monitor status values remain unchanged in monitor rows. The public API only derives the snapshot-level status.

### Caching

Return `Cache-Control: no-cache` because the frontend refreshes periodically and monitor results already come from persisted aggregates. The public request never triggers an upstream probe.

## Frontend Design

### Route And Shell

Add unauthenticated route `/status`. The page uses the existing public Home Header and the Public Sans/pricing color system so it remains visually consistent with `/pricing` while following the `status.quotajet.com` layout:

- Status hero with overall health.
- Grouped monitor sections.
- Monitor rows with availability badge and recent check bars.
- Last refresh and automatic refresh countdown.

The Header's public status link becomes an internal `/status` route. Existing authenticated navigation remains unchanged.

### Grouping

Rows are grouped by `group_name`. If `group_name` is empty, the monitor name is used. Multiple monitors in the same group remain separate rows because they may target different providers or primary models.

### Data Display

Each row displays:

- Monitor or group name.
- Provider and primary model.
- Current status.
- Current request latency.
- Seven-day availability.
- Recent timeline bars.

Timeline bars use the existing operational/degraded/failed/error values and represent missing history as unknown rather than successful.

### Refresh And Failure States

- Fetch immediately on mount.
- Refresh every 60 seconds without triggering monitor checks.
- Show a countdown to the next refresh.
- Keep the last successful snapshot visible during silent refreshes.
- Show a loading skeleton only before the first result.
- Show an empty state when monitoring is disabled or no enabled monitors exist.
- Show a retryable error state when the public endpoint fails and no prior snapshot is available.

## Security

- The public handler is read-only.
- It reuses the sanitized user-view DTO rather than serializing `ChannelMonitor` entities.
- No JWT, API key, cookie, endpoint, or monitor request configuration is returned.
- The endpoint does not run probes and therefore cannot be abused to amplify upstream traffic.

## Testing

Backend regression coverage will verify:

- `/api/v1/status` is reachable without authentication.
- Disabled monitoring returns a successful empty snapshot.
- Enabled monitor output contains public health fields.
- Sensitive monitor fields are absent.
- Overall status derivation handles operational, degraded, and empty data.

Frontend coverage will verify:

- `/status` is public.
- The Header links to `/status`.
- Monitor results are grouped and rendered correctly.
- Loading, empty, error, and refresh states behave correctly.
- No authenticated monitor-management controls appear on the public page.

## Deployment

The change follows the existing `main` push workflow. After CI and deployment succeed, verify `/api/v1/status` and `/status` on `sub.quotajet.com`, including desktop and mobile layouts.

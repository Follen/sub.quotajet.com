# Main Homepage Parity Design

## Objective

Rebuild the public homepage in `D:\Code\QuotaJet.com\sub.quotajet.com` so it matches the current homepage from `D:\Code\QuotaJet.com\QuotaJet.com` one-for-one in content, layout, motion, responsive behavior, theme behavior, and user-visible branding.

This phase covers the homepage only. The native Sub2API status page is deferred to a separate design and implementation phase.

## Source Of Truth

- Source repository: `D:\Code\QuotaJet.com\QuotaJet.com`
- Source implementation: `web/default/src/features/home/`
- Source landing styles: the `qj-landing` and landing-specific rules in `web/default/src/styles/index.css`
- Source visual reference: the live `https://quotajet.com/` homepage
- Source assets include the QuotaJet logo and `empty_warehouse_01_1k.hdr`

The target repository must copy every required asset into its own tree. It must not import from or depend on the sibling main-site repository at runtime or build time.

## Chosen Approach

Implement a native Vue 3 port inside the target frontend. React components will be translated into focused Vue components while preserving the rendered structure, dimensions, colors, animations, and interactions.

Rejected alternatives:

- An iframe would create a runtime dependency on the production main site and would use the wrong authentication state and routes.
- A static HTML snapshot would lose the Three.js interaction, animated metrics, theme switching, responsive behavior, and target-app integration.

## Page Structure

The target homepage will reproduce these source sections in the same order:

1. Public header with QuotaJet branding, navigation, language switch, theme switch, notifications, and sign-in state.
2. Industrial-grid hero with the private-gateway label, two-line headline, supporting copy, primary and secondary actions, and three live metrics.
3. Interactive black liquid-metal Three.js object using the copied HDR environment map.
4. Privacy card explaining that request and response content are not stored.
5. Model-routing card with the same supported-provider presentation.
6. Cost-visibility card with the same comparison treatment.
7. Reliability card with the same route-switch and continuity indicators.
8. Tool-compatibility card with the same continuously scrolling tool strip.
9. Final CTA section.
10. QuotaJet footer with legal links.

The homepage must match the source on desktop and mobile. Text must not overlap, horizontal scrolling is not allowed, and reduced-motion preferences must disable nonessential continuous motion.

## Vue Component Boundaries

`HomeView.vue` remains the route-level coordinator. New homepage components will live under `frontend/src/components/home/` and will be split by stable visual responsibility:

- `HomeHeader.vue`
- `HomeHero.vue`
- `RelayMachineVisual.vue`
- `HomeMetrics.vue`
- `PrivacyFeature.vue`
- `ModelRoutingFeature.vue`
- `CostVisibilityFeature.vue`
- `ReliabilityFeature.vue`
- `ToolsMarquee.vue`
- `HomeCallToAction.vue`
- `HomeFooter.vue`

Shared homepage styles will live in one landing-specific stylesheet imported by `HomeView.vue`. Three.js lifecycle ownership stays inside `RelayMachineVisual.vue`, including renderer disposal, resize handling, pointer interaction, and reduced-motion behavior.

## Metrics Contract

The target backend will expose an unauthenticated landing-metrics endpoint under the existing `/api/v1` API namespace. Its response will preserve the main-site fields and behavior:

```json
{
  "total_requests": 48219037,
  "total_users": 18287,
  "stable_uptime_seconds": 8553900,
  "generated_at": 1782496800
}
```

The endpoint will use the same epoch, baselines, five-minute buckets, and incremental growth formula as the main site. The frontend will continue incrementing requests, users, and uptime between server refreshes. If the endpoint fails, the source fallback baselines remain visible and the homepage stays usable.

## Route Mapping

- Home: `/home`
- Console: `/dashboard`
- Primary hero and CTA action: `/register` for signed-out users, `/dashboard` for signed-in users
- Models: the model-routing section anchor on the homepage
- Docs and setup guide: sanitized `doc_url` from public settings when configured
- About: the homepage feature-section anchor
- Status: `https://status.quotajet.com/` during this homepage-only phase; a later status phase will switch it to the target-native `/status` route
- Sign in: `/login`
- User Agreement: `/legal/terms`
- Privacy Policy: `/legal/privacy` only when public settings expose a legal document with the `privacy` ID; otherwise omit this optional footer link so the default installation does not navigate to a missing document

Missing optional `doc_url` values and missing optional legal documents must not produce broken links.

## Branding And Localization

QuotaJet is the fixed public brand for the copied homepage. The existing target public settings still provide authentication state, document URL, language, theme, and notification behavior.

All user-visible homepage text must use the target i18n system. English and Chinese landing dictionaries will reproduce the main-site copy. Technical Sub2API identifiers, package paths, container names, API protocols, and backend module names remain unchanged.

## Dependencies And Assets

- Add `three` and its TypeScript types using the target repository's existing pnpm workflow.
- Copy the HDR environment asset into `frontend/public/assets/`.
- Reuse the target repository's existing `@lobehub/icons`, Vue, Tailwind, theme, and i18n dependencies.
- Do not add a second animation framework.

## Error Handling

- Landing metrics failure falls back silently to the source baseline values.
- Three.js initialization failure leaves the hero copy and actions usable and does not block page rendering.
- Missing or invalid `doc_url` removes the Docs action instead of rendering an unsafe URL.
- Missing image assets fall back to `/logo.png` where a QuotaJet logo is required.

## Testing And Verification

Backend coverage will assert the exact landing metric baselines, epoch behavior, bucket growth, response schema, and public route registration.

Frontend coverage will assert:

- the complete section order and source copy;
- signed-in and signed-out CTA route mapping;
- Docs URL sanitization and omission;
- metric fallback and incremental formatting;
- reduced-motion behavior;
- Three.js canvas presence and cleanup;
- desktop and mobile navigation behavior.

Final verification requires:

- target frontend lint, typecheck, focused tests, and production build;
- focused backend tests and build;
- Playwright screenshots at desktop and mobile widths compared with `https://quotajet.com/`;
- a nonblank Three.js canvas pixel check;
- no text overlap or horizontal overflow;
- deployment only to `sub.quotajet.com` after CI succeeds.

## Explicit Non-Goals

- Do not implement the target-native Status page in this phase.
- Do not change `quotajet.com`, its DNS, Nginx configuration, or NEWAPI deployment.
- Do not copy React runtime code into the Vue bundle.
- Do not change authenticated dashboard behavior outside navigation targets used by the homepage.

# Model Marketplace Design

## Goal

Add a public model marketplace to `sub2api` with a premium model-detail experience inspired by the supplied OpenRouter reference, while using `sub2api`'s own channels, platforms, groups, endpoints, prices, rate multipliers, and tiered billing data.

The page is a model catalog and developer reference. It is not a model purchase flow and does not couple model details to Waffo Pancake or another payment provider.

## User experience

The route is public and does not require authentication. The page uses a dark, high-contrast developer-tool layout:

- A horizontal platform switcher at the top (for example OpenAI, Grok, Anthropic, Gemini), populated from public platform data rather than hard-coded providers.
- A model selector/list under the active platform, with search and a clear selected state.
- A left detail navigation rail with Providers, Effective Pricing, Performance, Uptime, Benchmarks, Apps, and Activity. Sections without data remain visible but show a deliberate empty state rather than fabricated metrics.
- A main detail panel for the selected model. The first implementation prioritizes Providers and Effective Pricing, then adds the remaining sections as data-backed or honest empty states.
- A Quick Start panel showing the `sub2api` OpenAI-compatible endpoint, model identifier, request examples, copy buttons, and a link to the authenticated API-key page for creating a key.
- Responsive behavior: platform tabs remain horizontally scrollable, the detail rail collapses into a compact selector on small screens, and code blocks remain readable without forcing page-wide overflow.

The visual language should match the reference's dark surface hierarchy, compact typography, lime/green active accent, bordered cards, code blocks, and restrained motion, while retaining the project's existing Vue/i18n/accessibility conventions.

## Public data contract

Add a dedicated public endpoint rather than weakening the authenticated available-channels endpoint:

```text
GET /api/v1/model-marketplace
```

The endpoint returns only active channels and non-exclusive (`is_exclusive = false`) groups. It aggregates duplicate models by platform and model name and includes:

- platform and model identity;
- vendor/provider metadata when available;
- supported inbound endpoint types;
- public provider/channel associations;
- group name and public rate multiplier;
- effective prices for token, cache, image, and per-request modes;
- tier intervals with min/max token bounds and tier labels;
- capability flags for sections that have real data;
- a stable generated timestamp/version for client refresh behavior.

User-specific group rates, private groups, account health internals, credentials, and admin-only routing fields are excluded. LiteLLM fallback prices may be marked as fallback/display-only and must never be presented as the configured billing rule when channel pricing exists.

## Price semantics

The API preserves `sub2api` billing semantics rather than converting them to the legacy model-ratio shape:

- `billing_mode=token`: input/output/cache prices and optional tier intervals;
- `billing_mode=per_request`: per-request price;
- `billing_mode=image`: image/output pricing fields;
- group multipliers are shown alongside base prices;
- tier intervals retain inclusive lower bounds and nullable upper bounds;
- absent prices remain absent, not zero;
- the UI labels prices with their unit and clearly distinguishes base price from group-adjusted effective price.

The public response is display-only. Actual billing continues through the existing gateway and billing services.

## Frontend structure

Create a dedicated Vue view and small focused components under the user-facing frontend:

- marketplace shell and platform tabs;
- model list/selector;
- detail navigation;
- provider/effective-pricing sections;
- tier table;
- Quick Start code panel;
- empty/loading/error states.

Use `useTranslation()` for all visible text, reuse existing code-copy and API-client utilities, and keep model selection in URL query state when practical so links to a model remain shareable.

The Quick Start examples use the configured public API origin and the selected model name. The create-key action links to the existing authenticated key-management route; it does not create credentials from a public request.

## Backend architecture

Keep aggregation in a service-level public marketplace builder, separate from the authenticated available-channel handler. Reuse channel/group repositories and existing pricing normalization helpers where possible. Add DTOs that are explicitly public and test the aggregation rules independently from HTTP wiring.

Public filtering and aggregation rules:

1. Ignore inactive channels and inactive/deleted groups.
2. Ignore exclusive groups.
3. Keep only models supported by at least one remaining public group.
4. Merge duplicate model/platform entries while retaining all public provider/group price variants.
5. Sort platforms and models deterministically.
6. Return empty sections for unavailable metrics instead of guessing performance or benchmark values.

## Testing and verification

Backend regression coverage will verify public filtering, deduplication, deterministic ordering, tier preservation, fallback-price labeling, and absence of private fields. Frontend tests will verify platform/model selection, price and tier rendering, Quick Start model substitution, copy/link behavior, and public empty/error states. A production frontend build and focused backend/frontend tests are required before completion.

## Explicit non-goals

- No direct model purchase or model-specific checkout.
- No Waffo Pancake integration in the marketplace.
- No exposure of private groups, user-specific rates, credentials, account health internals, or admin routing configuration.
- No invented benchmark, uptime, performance, or activity metrics; those sections remain empty until real data sources are approved.

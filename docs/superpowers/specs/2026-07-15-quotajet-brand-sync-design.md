# QuotaJet Brand Sync Design

## Objective

Make the Sub2API fork present the same public QuotaJet identity as the current main site while it continues to run independently at `sub.quotajet.com` during second development.

Metadata must describe the future production identity at `https://quotajet.com`, even during the test phase. No production DNS, Nginx, or NEWAPI service changes are part of this work.

## Source Of Truth

When project instructions or the user refer to the "main site", they mean:

`D:\Code\QuotaJet.com\QuotaJet.com`

The brand source files are:

- `web/default/public/logo.png`
- `web/default/public/favicon.ico`
- `web/default/index.html`

The Sub2API repository must contain copied assets and metadata. It must not depend on the main-site repository through runtime imports, relative filesystem paths, symlinks, or build-time access.

## Selected Approach

Use a complete brand sync across static assets, document metadata, source defaults, and persisted runtime settings.

Static-only changes are insufficient because Sub2API loads `site_name` and `site_logo` from its settings table. Runtime-only changes are insufficient because crawlers and the initial HTML response need stable QuotaJet metadata before application hydration.

## Brand Assets

Copy the main-site `logo.png` byte-for-byte to `frontend/public/logo.png`.

Copy the main-site `favicon.ico` byte-for-byte to `frontend/public/favicon.ico`.

The Sub2API HTML must reference both assets with the same cache-version query used by the main site. The copied files become normal tracked files in this repository.

## Metadata

Replace the minimal Sub2API head metadata with the main-site QuotaJet metadata:

- Document title and meta title: `QuotaJet`
- Description: `One private gateway for fast routes, fair pricing, and mainstream AI models.`
- OpenGraph type: `website`
- OpenGraph URL: `https://quotajet.com/`
- OpenGraph site name and title: `QuotaJet`
- OpenGraph image: `https://quotajet.com/logo.png?v=quotajet-20260618`
- Twitter card: `summary`
- Twitter title, description, and image matching OpenGraph
- Theme color: `#fff`
- Google translation opt-out matching the main site

The test deployment intentionally advertises the future production URL. No canonical link will be invented unless the main-site source adds one.

## Runtime Branding

Change user-visible fallback/default values from `Sub2API` to `QuotaJet` only where they represent the deployed site identity:

- Initial settings defaults for `site_name` and `site_logo`
- Public settings fallbacks
- Frontend store and document-title fallbacks
- Authentication views that display a fallback site name

Do not globally rename Sub2API. Keep protocol identifiers, package/module paths, container names, database names, storage keys, API subprotocols, legal documents, upstream links, and technical product references unchanged unless they are directly rendered as the deployed site identity.

The runtime logo value will be `/logo.png`.

## Existing Deployment

The test database already contains persisted Sub2API defaults, so source fallback changes alone will not update it.

Add an idempotent QuotaJet brand settings SQL file for the PostgreSQL deployment. The deployment script will apply it after PostgreSQL is healthy, then restart or recreate the application only when needed so the running process sees:

- `site_name = QuotaJet`
- `site_logo = /logo.png`

The operation must be repeatable on every CI deployment without changing unrelated settings.

## Project Instructions

Update `AGENTS.md` with these durable rules:

- "Main site" means `D:\Code\QuotaJet.com\QuotaJet.com`.
- Main-site branding is the visual and metadata source of truth.
- The Sub2API repository remains independently buildable and deployable.
- During second development, do not modify production `quotajet.com`, its Nginx configuration, DNS, or the running NEWAPI deployment.

## Verification

Add focused regression checks that verify:

- Required QuotaJet metadata is present with the future production URL.
- Static Logo and favicon references are present.
- QuotaJet runtime defaults are used in document-title and public settings behavior.
- Deployment brand SQL updates only `site_name` and `site_logo` and is idempotent.
- Existing frontend type checks and focused tests pass.
- Docker image builds and the deployed `/health` endpoint remains healthy.
- `https://sub.quotajet.com` returns `200` and serves QuotaJet metadata/assets after deployment.

## Rollback

Rollback is a normal Git revert followed by the existing deployment workflow. The persisted settings can be restored to `Sub2API` and an empty logo through the admin settings UI or an explicit reverse SQL update.

This rollback does not involve production `quotajet.com` because production cutover is outside this scope.

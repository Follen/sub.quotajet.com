# QuotaJet Next Production Trial Design

## Status

Approved approach: deploy a fresh, isolated Sub2API stack to the QuotaJet
production host and expose it temporarily at `sub.quotajet.com`.

The deployment does not migrate data from the existing test host. The runtime
layout uses the neutral name `quotajet-next`; the temporary `sub` hostname must
not become part of persistent mount paths or container names.

## Goals

- Build and deploy an immutable QuotaJet Sub2API image from a version tag.
- Run the trial beside the current `quotajet.com` NEWAPI stack without sharing
  containers, ports, databases, Redis, files, or Docker Compose projects.
- Initialize a fresh database and the administrator account supplied for this
  deployment.
- Validate the new origin before changing Cloudflare DNS.
- Keep the runtime and data paths usable when Sub2API later replaces NEWAPI on
  the main domain.

## Non-Goals

- Do not migrate users, accounts, channels, groups, models, pricing, logs, or
  other data from `70.39.198.45`.
- Do not stop, modify, or reuse the current `quotajet.com`, PostgreSQL, Redis,
  payment, or status containers during this trial.
- Do not switch `quotajet.com`, `www.quotajet.com`, or
  `status.quotajet.com` in this deployment.

## Runtime Layout

The production host is reached through the existing production SSH target and
currently serves the main site from `127.0.0.1:3000`. The new stack uses:

| Resource | Production value |
| --- | --- |
| Compose project | `quotajet-next` |
| Application directory | `/www/apps/quotajet-next` |
| Application container | `quotajet-next` |
| PostgreSQL container | `postgres.quotajet-next` |
| Redis container | `redis.quotajet-next` |
| PostgreSQL data | `/www/data/postgres/quotajet-next` |
| Redis data | `/www/data/redis/quotajet-next` |
| Application data | `/www/data/sub2api/quotajet-next` |
| Origin listener | `127.0.0.1:8081` |
| Trial hostname | `sub.quotajet.com` |

The Compose file must use a versioned image such as
`ghcr.io/follen/sub2api:<version>`. It must not build from source on the
production host and must not use `latest`.

## Release And Deployment Flow

1. A QuotaJet release tag points to a commit contained in `origin/main`.
2. The existing Release workflow builds and publishes the versioned GHCR
   image.
3. A production deployment job runs only after the image build succeeds. It
   uses a GitHub `production` environment and production-specific SSH secrets.
4. The job copies only the production Compose and deployment files to
   `/www/apps/quotajet-next`, then deploys the exact image tag.
5. The deployment script preserves the server-side `.env`, pulls the image,
   starts the stack, waits for container health, and verifies the deployed
   image/version.
6. The first deployment creates a server-only `.env` with mode `600`. The
   supplied administrator credentials and generated database, Redis, JWT, and
   TOTP secrets are never committed or printed.

The existing main-push test-server deployment is replaced by this explicit,
tag-driven production flow. Routine pushes to `main` must not deploy
production automatically.

## Nginx And DNS

The operations repository owns a dedicated production Nginx server block for
`sub.quotajet.com`. It uses the installed Cloudflare origin certificate and
proxies HTTP and WebSocket traffic to `http://127.0.0.1:8081` with the standard
forwarded headers and the required request-body limit.

Before reload, the current Nginx configuration is backed up and `nginx -t`
must pass. The new server block is additive and must not edit the existing main,
status, or payment server blocks.

Cloudflare record `9bc03ccb3d6fb9d2c636b083d8f4cddc` is updated in place only
after origin validation. The update changes `content` from `70.39.198.45` to
the production origin while preserving `type=A`, `proxied=true`, `ttl=1`, the
record name, comment, and tags.

## Validation And Failure Handling

Before DNS changes:

- Validate Compose rendering and deployment regression tests locally and in CI.
- Confirm all three new containers are healthy and use only their dedicated
  mounts and network.
- Confirm the current main, payment, PostgreSQL, and Redis containers remain
  healthy and unchanged.
- Check the local origin health endpoint and the public pages through the new
  Nginx virtual host using an explicit origin address.
- Verify administrator login without logging credentials.
- Verify `/`, `/pricing`, `/status`, and the public health/API contracts.

If build, pull, startup, health, login, Nginx, or origin checks fail, the
process stops before DNS mutation. After the DNS update, re-read the record
through the Cloudflare API and validate HTTPS behavior through Cloudflare.

## Rollback

- Record the deployed image tag and the previous Compose and Nginx files before
  applying changes.
- Application rollback redeploys the last known-good immutable image.
- Nginx rollback restores the timestamped configuration backup and runs
  `nginx -t` before reload.
- DNS rollback restores the same Cloudflare record content to
  `70.39.198.45`, preserving all other attributes. The old origin is currently
  unhealthy, so DNS rollback restores configuration state but is not expected
  to restore service.
- The new data directories are retained during rollback. No rollback command
  removes persistent data.

## Future Main-Site Cutover

The trial hostname is only an entry point. When Sub2API is later approved to
replace NEWAPI, the `quotajet.com` Nginx upstream can be switched to the
existing `quotajet-next` listener. The application directory, database, Redis,
application data, container names, and Compose project remain in place. That
future cutover requires a separate backup, migration, validation, and rollback
plan and is outside this deployment.

## Required Regression Coverage

- Deployment tests assert tag-only immutable images, neutral
  `quotajet-next` paths, dedicated containers, `127.0.0.1:8081`, persistent
  mounts, health gates, and the absence of production-host source builds.
- Workflow tests assert production environment use, release dependency,
  production-specific secrets, and no deployment from ordinary `main` pushes.
- Operations tests assert the additive `sub.quotajet.com` Nginx server block,
  upstream port, TLS files, forwarded headers, and unchanged existing configs.
- End-to-end acceptance records the release SHA/image tag, container health,
  origin checks, Cloudflare record attributes, and public HTTPS results.

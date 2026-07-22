# QuotaJet Next Production Trial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy a fresh, immutable Sub2API release beside the existing QuotaJet production stack and expose it at `sub.quotajet.com` without baking the trial hostname into runtime mounts.

**Architecture:** The business repository publishes `ghcr.io/follen/sub2api:<version>` and deploys it through a reusable, tag-driven production workflow. The isolated `quotajet-next` Compose project listens on `127.0.0.1:8081`; the operations repository owns its production Nginx virtual host and runtime baseline. Cloudflare DNS changes only after direct-origin checks pass.

**Tech Stack:** GitHub Actions, GoReleaser, Docker Compose, Bash, Nginx, PostgreSQL 18, Redis 8, Cloudflare DNS API, Python unittest.

## Global Constraints

- Do not migrate any data from `70.39.198.45`.
- Use `quotajet-next` for application, Compose, container, and mount naming; only the trial hostname contains `sub`.
- Keep `quotajet.com`, `status.quotajet.com`, `pay.quotajet.com`, their containers, port `3000`, databases, Redis, and Nginx server blocks unchanged.
- Bind the trial application only to `127.0.0.1:8081`.
- Use an immutable `ghcr.io/follen/sub2api:<version>` image; never build on the production host and never deploy `latest`.
- Store credentials only in GitHub production-environment secrets and `/www/apps/quotajet-next/.env` with mode `600`; never print or commit values.
- Update Cloudflare record `9bc03ccb3d6fb9d2c636b083d8f4cddc` in place, preserving proxy, TTL, comment, and tags.
- Do not remove persistent data during deployment or rollback.

---

### Task 1: Lock The Business Deployment Contract

**Files:**
- Modify: `deploy/tests/quotajet-deploy-test.sh`
- Test: `deploy/tests/quotajet-deploy-test.sh`

**Interfaces:**
- Consumes: Existing deployment file paths and the approved runtime layout.
- Produces: Static regression assertions that define the production workflow, Compose overlay, bootstrap environment, and deployment script contracts.

- [ ] **Step 1: Replace test-server assertions with production assertions**

Add exact checks for these contracts:

```bash
grep -Fq 'image: ${SUB2API_IMAGE:?SUB2API_IMAGE is required}' "$compose_file"
grep -Fq 'container_name: quotajet-next' "$compose_file"
grep -Fq 'container_name: postgres.quotajet-next' "$compose_file"
grep -Fq 'container_name: redis.quotajet-next' "$compose_file"
grep -Fq '/www/data/sub2api/quotajet-next:/app/data' "$compose_file"
grep -Fq '/www/data/postgres/quotajet-next:/var/lib/postgresql/data' "$compose_file"
grep -Fq '/www/data/redis/quotajet-next:/data' "$compose_file"
! grep -q 'build:' "$compose_file"
! grep -q ':latest' "$compose_file"

grep -Fq 'project_name="quotajet-next"' "$deploy_script"
grep -Fq 'docker compose --project-name "$project_name"' "$deploy_script"
grep -Fq 'pull' "$deploy_script"
! grep -q -- '--build' "$deploy_script"
grep -Fq '127.0.0.1' "$env_template"
grep -Fq 'SERVER_PORT=8081' "$env_template"

grep -Fq 'workflow_call:' "$workflow_file"
grep -Fq 'workflow_dispatch:' "$workflow_file"
grep -Fq 'environment: production' "$workflow_file"
grep -Fq '/www/apps/quotajet-next' "$workflow_file"
grep -Fq 'PROD_DEPLOY_HOST' "$workflow_file"
grep -Fq 'PROD_ADMIN_PASSWORD' "$workflow_file"
! grep -q 'workflow_run:' "$workflow_file"
! grep -q '/opt/sub.quotajet.com' "$workflow_file"

grep -Fq 'uses: ./.github/workflows/deploy-quotajet.yml' "$release_workflow"
grep -Fq 'needs: release' "$release_workflow"
```

- [ ] **Step 2: Run the deployment test and verify RED**

Run: `bash deploy/tests/quotajet-deploy-test.sh`

Expected: FAIL on the first missing production image/container assertion because the current overlay still builds `quotajet/sub2api:dev`.

- [ ] **Step 3: Commit the failing contract test**

```bash
git add deploy/tests/quotajet-deploy-test.sh
git commit -m "test: define quotajet-next deployment contract"
```

### Task 2: Implement The Immutable Production Deployment

**Files:**
- Create: `deploy/quotajet.env.example`
- Modify: `deploy/docker-compose.quotajet.yml`
- Modify: `deploy/quotajet-deploy.sh`
- Modify: `.github/workflows/deploy-quotajet.yml`
- Modify: `.github/workflows/release.yml`
- Test: `deploy/tests/quotajet-deploy-test.sh`

**Interfaces:**
- Consumes: `SUB2API_IMAGE=ghcr.io/follen/sub2api:<version>` and a bootstrap file containing base64-encoded administrator credentials.
- Produces: Healthy `quotajet-next`, `postgres.quotajet-next`, and `redis.quotajet-next` containers plus a reusable `image_tag` deployment workflow.

- [ ] **Step 1: Add the server-only environment template**

Create `deploy/quotajet.env.example` with non-secret defaults and empty secret fields:

```dotenv
BIND_HOST=127.0.0.1
SERVER_PORT=8081
SERVER_MODE=release
TZ=Asia/Shanghai
POSTGRES_USER=sub2api
POSTGRES_PASSWORD=
POSTGRES_DB=sub2api
REDIS_PASSWORD=
ADMIN_EMAIL=
ADMIN_PASSWORD=
JWT_SECRET=
TOTP_ENCRYPTION_KEY=
SUB2API_IMAGE=
```

- [ ] **Step 2: Convert the QuotaJet Compose overlay to isolated production resources**

Use this overlay structure:

```yaml
services:
  sub2api:
    image: ${SUB2API_IMAGE:?SUB2API_IMAGE is required}
    container_name: quotajet-next
    volumes:
      - /www/data/sub2api/quotajet-next:/app/data:Z

  postgres:
    container_name: postgres.quotajet-next
    volumes:
      - /www/data/postgres/quotajet-next:/var/lib/postgresql/data:Z

  redis:
    container_name: redis.quotajet-next
    volumes:
      - /www/data/redis/quotajet-next:/data:Z
```

- [ ] **Step 3: Rewrite the deployment script around an immutable image**

The script must:

```bash
project_name="quotajet-next"
app_container="quotajet-next"
postgres_container="postgres.quotajet-next"
redis_container="redis.quotajet-next"

: "${SUB2API_IMAGE:?SUB2API_IMAGE is required}"

if [[ ! -f "$env_file" ]]; then
  test -s "$bootstrap_file"
  cp "$deploy_dir/quotajet.env.example" "$env_file"
  set_env ADMIN_EMAIL "$(read_bootstrap_b64 ADMIN_EMAIL_B64)"
  set_env ADMIN_PASSWORD "$(read_bootstrap_b64 ADMIN_PASSWORD_B64)"
  set_env POSTGRES_PASSWORD "$(generate_secret)"
  set_env REDIS_PASSWORD "$(generate_secret)"
  set_env JWT_SECRET "$(generate_secret)"
  set_env TOTP_ENCRYPTION_KEY "$(generate_secret)"
fi
rm -f "$bootstrap_file"
set_env SUB2API_IMAGE "$SUB2API_IMAGE"
chmod 600 "$env_file"

mkdir -p \
  /www/data/sub2api/quotajet-next \
  /www/data/postgres/quotajet-next \
  /www/data/redis/quotajet-next

docker compose --project-name "$project_name" "${compose_files[@]}" config >/dev/null
docker compose --project-name "$project_name" "${compose_files[@]}" pull
docker compose --project-name "$project_name" "${compose_files[@]}" up -d --remove-orphans
```

Health waits must inspect all three exact container names. Branding SQL must run through `postgres.quotajet-next`; the application restart and image verification must use `quotajet-next`.

- [ ] **Step 4: Convert the workflow to reusable/manual production deployment**

Define both triggers with required `image_tag`, set `environment: production`, normalize an optional leading `v`, reject tags outside `^[0-9A-Za-z._-]+$`, and form `ghcr.io/follen/sub2api:<normalized-tag>`.

The workflow must use these environment secrets:

```yaml
PROD_DEPLOY_HOST: ${{ secrets.PROD_DEPLOY_HOST }}
PROD_DEPLOY_USER: ${{ secrets.PROD_DEPLOY_USER }}
PROD_DEPLOY_SSH_KEY: ${{ secrets.PROD_DEPLOY_SSH_KEY }}
PROD_DEPLOY_KNOWN_HOSTS: ${{ secrets.PROD_DEPLOY_KNOWN_HOSTS }}
PROD_ADMIN_EMAIL: ${{ secrets.PROD_ADMIN_EMAIL }}
PROD_ADMIN_PASSWORD: ${{ secrets.PROD_ADMIN_PASSWORD }}
```

Create `.bootstrap.env` with base64 values and mode `600`, upload only the two Compose files, environment template, branding SQL, deployment script, and bootstrap file to `/www/apps/quotajet-next`, then invoke the script with the normalized immutable image.

- [ ] **Step 5: Chain production deployment after a successful release**

Add this job to `.github/workflows/release.yml`:

```yaml
  deploy-production:
    needs: release
    if: ${{ needs.release.result == 'success' }}
    uses: ./.github/workflows/deploy-quotajet.yml
    with:
      image_tag: ${{ github.event.inputs.tag || github.ref_name }}
    secrets: inherit
```

- [ ] **Step 6: Run tests and syntax checks to verify GREEN**

Run:

```bash
bash deploy/tests/quotajet-deploy-test.sh
bash -n deploy/quotajet-deploy.sh
git diff --check
```

Expected: all commands exit `0` with no output from the deployment test or syntax checker.

- [ ] **Step 7: Commit the production deployment implementation**

```bash
git add deploy .github/workflows/deploy-quotajet.yml .github/workflows/release.yml
git commit -m "feat: deploy quotajet-next from release images"
```

### Task 3: Lock The Operations Runtime Contract

**Files:**
- Modify: `D:/Code/QuotaJet.com/ops.quotajet.com/tests/test_ci_paths.py`
- Test: `D:/Code/QuotaJet.com/ops.quotajet.com/tests/test_ci_paths.py`

**Interfaces:**
- Consumes: The approved `quotajet-next` paths and `127.0.0.1:8081` upstream.
- Produces: Regression coverage for the new mount document, Compose baseline, and additive Nginx virtual host.

- [ ] **Step 1: Add failing operations tests**

Add tests that read the new files and assert:

```python
def test_quotajet_next_mounts_are_domain_neutral(self):
    text = (ROOT / "mounts" / "quotajet-next.md").read_text(encoding="utf-8")
    self.assertIn("/www/apps/quotajet-next", text)
    self.assertIn("/www/data/postgres/quotajet-next", text)
    self.assertNotIn("/www/apps/sub.quotajet.com", text)

def test_sub_trial_nginx_is_additive(self):
    text = (ROOT / "nginx" / "production-sub.conf").read_text(encoding="utf-8")
    self.assertIn("server_name sub.quotajet.com;", text)
    self.assertIn("proxy_pass http://127.0.0.1:8081;", text)
    self.assertIn("cloudflare-origin.crt", text)
    self.assertNotIn("server_name quotajet.com", text)

def test_quotajet_next_compose_uses_dedicated_resources(self):
    text = (ROOT / "docker" / "quotajet-next" / "production.yml").read_text(encoding="utf-8")
    self.assertIn("name: quotajet-next", text)
    self.assertIn("container_name: quotajet-next", text)
    self.assertIn("127.0.0.1:8081:8080", text)
    self.assertNotIn(":latest", text)
```

- [ ] **Step 2: Run the focused operations test and verify RED**

Run: `python -m unittest tests.test_ci_paths -v`

Expected: ERROR for missing `mounts/quotajet-next.md`, `nginx/production-sub.conf`, and `docker/quotajet-next/production.yml`.

- [ ] **Step 3: Commit the failing operations contract**

```bash
git add tests/test_ci_paths.py
git commit -m "test: define quotajet-next runtime contract"
```

### Task 4: Implement The Operations Baseline

**Files:**
- Create: `D:/Code/QuotaJet.com/ops.quotajet.com/nginx/production-sub.conf`
- Create: `D:/Code/QuotaJet.com/ops.quotajet.com/docker/quotajet-next/production.yml`
- Create: `D:/Code/QuotaJet.com/ops.quotajet.com/mounts/quotajet-next.md`
- Modify: `D:/Code/QuotaJet.com/ops.quotajet.com/Update.md`
- Test: `D:/Code/QuotaJet.com/ops.quotajet.com/tests/test_ci_paths.py`

**Interfaces:**
- Consumes: Trial application health on `127.0.0.1:8081`.
- Produces: Auditable production Nginx and Compose baselines plus mount ownership documentation.

- [ ] **Step 1: Add the isolated Nginx virtual host**

Create HTTP redirect and HTTPS proxy server blocks for only `sub.quotajet.com`. Use the existing Cloudflare origin certificate paths, `client_max_body_size 256m`, forwarded headers, HTTP/1.1 upgrade headers, and `proxy_pass http://127.0.0.1:8081`.

- [ ] **Step 2: Add the standalone Compose baseline**

Create `name: quotajet-next` with three dedicated services, the exact container/mount names from the design, `127.0.0.1:8081:8080`, required `SUB2API_IMAGE`, PostgreSQL/Redis health checks, and no `latest` tag or source build.

- [ ] **Step 3: Document mount ownership and future cutover**

Document all application/data paths, mode expectations for `.env`, the fact that `sub.quotajet.com` is only a trial route, and that future main-site cutover reuses these paths without moving data.

- [ ] **Step 4: Run the full operations test suite**

Run: `python -m unittest discover -s tests -v`

Expected: all tests pass with `OK`.

- [ ] **Step 5: Commit implementation and update log**

Commit runtime files first, then record that commit's short SHA in `Update.md` and commit the log:

```bash
git add nginx/production-sub.conf docker/quotajet-next/production.yml mounts/quotajet-next.md
git commit -m "feat: add quotajet-next production baseline"
runtime_commit="$(git rev-parse --short HEAD)"
# Add the 2026-07-22 Update.md row using $runtime_commit.
git add Update.md
git commit -m "docs: record quotajet-next infrastructure"
```

### Task 5: Verify And Integrate Both Repositories

**Files:**
- Verify only; no new files expected.

**Interfaces:**
- Consumes: Completed business and operations branches.
- Produces: Merged, pushed `main` revisions that are eligible for release and infrastructure application.

- [ ] **Step 1: Run business deployment verification**

```bash
bash deploy/tests/quotajet-deploy-test.sh
bash -n deploy/quotajet-deploy.sh
git diff --check
git status --short
```

Expected: tests exit `0`, no diff errors, clean worktree.

- [ ] **Step 2: Render the production Compose model with safe dummy secrets**

Run `docker compose` against the local base plus production overlay with dummy non-production values and a versioned image. Assert the rendered model has only `127.0.0.1:8081`, the three `quotajet-next` containers, and the three absolute mounts.

- [ ] **Step 3: Run operations verification**

```bash
python -m unittest discover -s tests -v
git diff --check
git status --short
```

Expected: all tests pass and both worktrees are clean.

- [ ] **Step 4: Push the business branch and integrate it into `main`**

Push `codex/quotajet-prod-trial`, merge it into current `main` without rewriting history, push `main`, and wait for CI and Security Scan to finish successfully.

- [ ] **Step 5: Open and merge the required operations PR**

Use `.github/PULL_REQUEST_TEMPLATE.md`, identify whether the current git author is a historical core developer, disclose AI assistance when required, wait for checks, merge the PR, and update local `main`.

### Task 6: Configure And Release The Production Trial

**Files:**
- GitHub production environment secrets and production-host runtime files; no committed secret files.

**Interfaces:**
- Consumes: Merged business release commit, production SSH identity, approved administrator credentials, and merged operations configuration.
- Produces: Healthy trial origin on `38.246.245.78` before DNS mutation.

- [ ] **Step 1: Create/update production environment secrets without output**

Set `PROD_DEPLOY_HOST`, `PROD_DEPLOY_USER`, `PROD_DEPLOY_SSH_KEY`, `PROD_DEPLOY_KNOWN_HOSTS`, `PROD_ADMIN_EMAIL`, and `PROD_ADMIN_PASSWORD` in the repository `production` environment. Compare the scanned SSH host-key fingerprint with the trusted local entry before updating the known-host secret.

- [ ] **Step 2: Apply the Nginx virtual host safely**

Copy merged `nginx/production-sub.conf` to a timestamped staging file, back up any existing target, install `/etc/nginx/sites-available/sub.quotajet.com.conf`, create its `sites-enabled` symlink, run `nginx -t`, and reload only after validation succeeds.

- [ ] **Step 3: Confirm main services before release**

Record current container image IDs and health for `quotajet.com`, `pay.quotajet.com`, `postgres.quotajet.com`, and `redis.quotajet.com`. Confirm port `8081` is unused and the three `quotajet-next` data directories are either absent or empty.

- [ ] **Step 4: Create and push an immutable QuotaJet release tag**

Create a unique `v0.1.162-qj.N` annotated tag at the merged `origin/main` commit, set the Release workflow to its simple x86_64 image mode for this host, push the tag, and wait for Release plus called production deployment jobs to finish.

- [ ] **Step 5: Validate the origin before DNS**

Verify container health and exact image tag on the server, local HTTP health on `127.0.0.1:8081`, Nginx routing with `Host: sub.quotajet.com`, direct-origin HTTPS using an explicit resolve override, administrator login, `/`, `/pricing`, `/status`, and public API health. Confirm the four pre-existing production containers retain their recorded images and health.

### Task 7: Cut Over Cloudflare And Complete Acceptance

**Files:**
- Cloudflare DNS record only; no repository files.

**Interfaces:**
- Consumes: Passing direct-origin acceptance checks.
- Produces: `sub.quotajet.com` served from the `quotajet-next` production trial with a recorded rollback point.

- [ ] **Step 1: Re-read the current DNS record immediately before mutation**

Assert record ID, `content=70.39.198.45`, `type=A`, `proxied=true`, `ttl=1`, comment, and tags still match the design. Stop if another actor changed it.

- [ ] **Step 2: Update only the origin content**

Use the Cloudflare DNS record update endpoint for record `9bc03ccb3d6fb9d2c636b083d8f4cddc`, changing only `content` to `38.246.245.78` and preserving all other fields.

- [ ] **Step 3: Re-read Cloudflare and verify public behavior**

Confirm the API returns the new content and preserved attributes. Verify Cloudflare HTTPS responses for `/`, `/pricing`, `/status`, and health/API endpoints, including expected status codes and Cloudflare response headers.

- [ ] **Step 4: Verify administrator access and production isolation**

Log in with the supplied administrator account without printing credentials. Confirm the database is fresh, the public model/pricing data is empty until configured, and the current main/payment/status services remain healthy.

- [ ] **Step 5: Record final deployment evidence**

Report the merged commit, release tag, deployed image, container health, Nginx validation, Cloudflare record content, tested URLs/statuses, and the exact rollback DNS value without reporting any secret.

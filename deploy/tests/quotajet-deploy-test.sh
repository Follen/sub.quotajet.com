#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
compose_file="$repo_root/deploy/docker-compose.quotajet.yml"
deploy_script="$repo_root/deploy/quotajet-deploy.sh"
env_template="$repo_root/deploy/quotajet.env.example"
workflow_file="$repo_root/.github/workflows/deploy-quotajet.yml"
release_workflow="$repo_root/.github/workflows/release.yml"

fail() {
  printf '%s\n' "$*" >&2
  exit 1
}

test -f "$compose_file"
test -f "$deploy_script"
test -f "$env_template"
test -f "$workflow_file"
test -f "$release_workflow"

grep -Fq 'image: ${SUB2API_IMAGE:?SUB2API_IMAGE is required}' "$compose_file"
grep -Fq 'container_name: quotajet-next' "$compose_file"
grep -Fq 'container_name: postgres.quotajet-next' "$compose_file"
grep -Fq 'container_name: redis.quotajet-next' "$compose_file"
grep -Fq '/www/data/sub2api/quotajet-next:/app/data' "$compose_file"
grep -Fq '/www/data/postgres/quotajet-next:/var/lib/postgresql/data' "$compose_file"
grep -Fq '/www/data/redis/quotajet-next:/data' "$compose_file"
grep -Fq 'SERVER_TRUSTED_PROXIES=172.30.255.1/32' "$compose_file" || fail "narrow trusted proxy is not configured"
grep -Fq 'SECURITY_TRUST_FORWARDED_IP_FOR_API_KEY_ACL=false' "$compose_file" || fail "legacy forwarded-header takeover is not disabled"
grep -Fq 'subnet: 172.30.255.0/28' "$compose_file" || fail "production network subnet is not pinned"
grep -Fq 'gateway: 172.30.255.1' "$compose_file" || fail "production network gateway is not pinned"
! grep -Fq '172.16.0.0/12' "$compose_file" || fail "broad private proxy range must not be trusted"
! grep -q 'build:' "$compose_file"
! grep -q ':latest' "$compose_file"

grep -Fq 'project_name="quotajet-next"' "$deploy_script"
grep -Fq 'docker compose --project-name "$project_name"' "$deploy_script"
grep -Fq 'pull' "$deploy_script"
! grep -q -- '--build' "$deploy_script"
grep -Fq '127.0.0.1' "$env_template"
grep -Fq 'SERVER_PORT=8081' "$env_template"
grep -Fq 'SUB2API_VERSION=' "$env_template" || fail "normalized version metadata is missing from env template"

bash "$repo_root/deploy/tests/quotajet-deploy-bootstrap-test.sh"
bash "$repo_root/deploy/tests/quotajet-workflow-normalize-test.sh"
bash "$repo_root/deploy/tests/quotajet-release-workflow-test.sh"

grep -Fq 'workflow_call:' "$workflow_file"
grep -Fq 'workflow_dispatch:' "$workflow_file"
grep -Fq 'environment: production' "$workflow_file"
grep -Fq '/www/apps/quotajet-next' "$workflow_file"
grep -Fq 'PROD_DEPLOY_HOST' "$workflow_file"
grep -Fq 'PROD_ADMIN_PASSWORD' "$workflow_file"
grep -Fq 'image_digest:' "$workflow_file" || fail "deployment workflow does not require an image digest"
grep -Fq 'ref: ${{ inputs.release_tag }}' "$workflow_file" || fail "deployment workflow does not checkout the requested release tag"
! grep -q 'workflow_run:' "$workflow_file"
! grep -q '/opt/sub.quotajet.com' "$workflow_file"

grep -Fq 'uses: ./.github/workflows/deploy-quotajet.yml' "$release_workflow"
grep -Fq 'needs: [validate-release, release]' "$release_workflow" || fail "production deploy must depend on validated release outputs"

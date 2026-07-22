#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
compose_file="$repo_root/deploy/docker-compose.quotajet.yml"
deploy_script="$repo_root/deploy/quotajet-deploy.sh"
env_template="$repo_root/deploy/quotajet.env.example"
workflow_file="$repo_root/.github/workflows/deploy-quotajet.yml"
release_workflow="$repo_root/.github/workflows/release.yml"

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
! grep -q 'build:' "$compose_file"
! grep -q ':latest' "$compose_file"

grep -Fq 'project_name="quotajet-next"' "$deploy_script"
grep -Fq 'docker compose --project-name "$project_name"' "$deploy_script"
grep -Fq 'pull' "$deploy_script"
! grep -q -- '--build' "$deploy_script"
grep -Fq '127.0.0.1' "$env_template"
grep -Fq 'SERVER_PORT=8081' "$env_template"

bash "$repo_root/deploy/tests/quotajet-deploy-bootstrap-test.sh"

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

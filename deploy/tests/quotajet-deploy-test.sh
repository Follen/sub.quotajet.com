#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
compose_file="$repo_root/deploy/docker-compose.quotajet.yml"
deploy_script="$repo_root/deploy/quotajet-deploy.sh"
workflow_file="$repo_root/.github/workflows/deploy-quotajet.yml"

test -f "$compose_file"
test -f "$deploy_script"
test -f "$workflow_file"

grep -q 'context: \.\.' "$compose_file"
grep -q 'dockerfile: Dockerfile' "$compose_file"
grep -q 'quotajet/sub2api:dev' "$compose_file"

grep -Eq 'set_env[[:space:]]+BIND_HOST[[:space:]]+127\.0\.0\.1' "$deploy_script"
grep -Eq 'set_env[[:space:]]+SERVER_PORT[[:space:]]+8081' "$deploy_script"
grep -q 'docker-compose\.local\.yml' "$deploy_script"
grep -q 'docker-compose\.quotajet\.yml' "$deploy_script"

grep -q 'workflow_run:' "$workflow_file"
grep -q 'head_branch == .main.' "$workflow_file"
grep -q 'conclusion == .success.' "$workflow_file"
grep -q '/opt/sub\.quotajet\.com' "$workflow_file"

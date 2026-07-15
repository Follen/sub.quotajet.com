#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
compose_file="$repo_root/deploy/docker-compose.quotajet.yml"
deploy_script="$repo_root/deploy/quotajet-deploy.sh"
brand_sql="$repo_root/deploy/quotajet-brand.sql"
workflow_file="$repo_root/.github/workflows/deploy-quotajet.yml"

test -f "$compose_file"
test -f "$deploy_script"
test -f "$brand_sql"
test -f "$workflow_file"

grep -q 'context: \.\.' "$compose_file"
grep -q 'dockerfile: Dockerfile' "$compose_file"
grep -q 'quotajet/sub2api:dev' "$compose_file"

grep -Eq 'set_env[[:space:]]+BIND_HOST[[:space:]]+127\.0\.0\.1' "$deploy_script"
grep -Eq 'set_env[[:space:]]+SERVER_PORT[[:space:]]+8081' "$deploy_script"
grep -q 'docker-compose\.local\.yml' "$deploy_script"
grep -q 'docker-compose\.quotajet\.yml' "$deploy_script"
grep -q "'site_name', 'QuotaJet'" "$brand_sql"
grep -q "'site_logo', '/logo.png'" "$brand_sql"
test "$(grep -Ec "'site_[^']+'" "$brand_sql")" -eq 2
grep -q 'quotajet-brand.sql' "$deploy_script"
grep -q 'docker exec -i sub2api-postgres psql' "$deploy_script"
grep -q 'read_env_value()' "$deploy_script"
grep -q 'postgres_user="$(read_env_value POSTGRES_USER)"' "$deploy_script"
grep -q 'postgres_db="$(read_env_value POSTGRES_DB)"' "$deploy_script"
grep -q 'postgres_user="${postgres_user:-sub2api}"' "$deploy_script"
grep -q 'postgres_db="${postgres_db:-sub2api}"' "$deploy_script"
grep -q 'psql -U "$postgres_user" -d "$postgres_db"' "$deploy_script"

mapfile -t health_wait_lines < <(grep -n '^wait_for_sub2api_health$' "$deploy_script" | cut -d: -f1)
brand_sql_line="$(grep -n 'quotajet-brand.sql' "$deploy_script" | tail -n 1 | cut -d: -f1)"
restart_line="$(grep -n 'docker restart sub2api' "$deploy_script" | cut -d: -f1)"

test "${#health_wait_lines[@]}" -eq 2
test "${health_wait_lines[0]}" -lt "$brand_sql_line"
test "$brand_sql_line" -lt "$restart_line"
test "$restart_line" -lt "${health_wait_lines[1]}"

grep -q 'workflow_run:' "$workflow_file"
grep -q 'head_branch == .main.' "$workflow_file"
grep -q 'conclusion == .success.' "$workflow_file"
grep -q '/opt/sub\.quotajet\.com' "$workflow_file"

#!/usr/bin/env bash

set -Eeuo pipefail

deploy_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
env_file="$deploy_dir/.env"
compose_files=(
  -f "$deploy_dir/docker-compose.local.yml"
  -f "$deploy_dir/docker-compose.quotajet.yml"
)

set_env() {
  local key="$1"
  local value="$2"

  if grep -q "^${key}=" "$env_file"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$env_file"
  else
    printf '%s=%s\n' "$key" "$value" >>"$env_file"
  fi
}

generate_secret() {
  openssl rand -hex 32
}

read_env_value() {
  local key="$1"

  sed -n "s/^${key}=//p" "$env_file" | tail -n 1
}

wait_for_sub2api_health() {
  for _ in $(seq 1 30); do
    if [[ "$(docker inspect --format '{{.State.Health.Status}}' sub2api)" == "healthy" ]]; then
      return
    fi
    sleep 2
  done

  test "$(docker inspect --format '{{.State.Health.Status}}' sub2api)" = "healthy"
}

command -v docker >/dev/null
command -v git >/dev/null
command -v openssl >/dev/null
docker compose version >/dev/null

if [[ ! -f "$env_file" ]]; then
  cp "$deploy_dir/.env.example" "$env_file"
  set_env POSTGRES_PASSWORD "$(generate_secret)"
  set_env REDIS_PASSWORD "$(generate_secret)"
  set_env ADMIN_PASSWORD "$(generate_secret)"
  set_env JWT_SECRET "$(generate_secret)"
  set_env TOTP_ENCRYPTION_KEY "$(generate_secret)"
fi

set_env BIND_HOST 127.0.0.1
set_env SERVER_PORT 8081
set_env SERVER_MODE release
set_env ADMIN_EMAIL admin@quotajet.com
set_env TZ Asia/Shanghai

chmod 600 "$env_file"
mkdir -p "$deploy_dir/data" "$deploy_dir/postgres_data" "$deploy_dir/redis_data"

export DEPLOY_COMMIT
DEPLOY_COMMIT="$(git -C "$deploy_dir/.." rev-parse --short HEAD)"

postgres_user="$(read_env_value POSTGRES_USER)"
postgres_db="$(read_env_value POSTGRES_DB)"
postgres_user="${postgres_user:-sub2api}"
postgres_db="${postgres_db:-sub2api}"

docker compose --project-name quotajet-sub2api "${compose_files[@]}" up -d --build --remove-orphans
wait_for_sub2api_health
docker exec -i sub2api-postgres psql -v ON_ERROR_STOP=1 -U "$postgres_user" -d "$postgres_db" <"$deploy_dir/quotajet-brand.sql"
site_name="$(docker exec -i sub2api-postgres psql -v ON_ERROR_STOP=1 -U "$postgres_user" -d "$postgres_db" -Atc "SELECT value FROM settings WHERE key = 'site_name'")"
site_logo="$(docker exec -i sub2api-postgres psql -v ON_ERROR_STOP=1 -U "$postgres_user" -d "$postgres_db" -Atc "SELECT value FROM settings WHERE key = 'site_logo'")"
if [[ "$site_name" != "QuotaJet" || "$site_logo" != "/logo.png" ]]; then
  printf 'QuotaJet brand settings were not persisted\n' >&2
  exit 1
fi
docker restart sub2api >/dev/null
wait_for_sub2api_health
docker compose --project-name quotajet-sub2api "${compose_files[@]}" ps

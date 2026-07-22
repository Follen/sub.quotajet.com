#!/usr/bin/env bash

set -Eeuo pipefail

project_name="quotajet-next"
app_container="quotajet-next"
postgres_container="postgres.quotajet-next"
redis_container="redis.quotajet-next"
deploy_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
env_file="$deploy_dir/.env"
bootstrap_file="$deploy_dir/.bootstrap.env"
compose_files=(
  -f "$deploy_dir/docker-compose.local.yml"
  -f "$deploy_dir/docker-compose.quotajet.yml"
)

trap 'rm -f "$bootstrap_file"' EXIT

cd "$deploy_dir"
umask 077

: "${SUB2API_IMAGE:?SUB2API_IMAGE is required}"
if [[ "$SUB2API_IMAGE" == "ghcr.io/follen/sub2api:latest" ]]; then
  printf 'SUB2API_IMAGE must not use the latest tag\n' >&2
  exit 1
fi
if [[ ! "$SUB2API_IMAGE" =~ ^ghcr\.io/follen/sub2api:[0-9A-Za-z][0-9A-Za-z._-]*$ ]]; then
  printf 'SUB2API_IMAGE must match ghcr.io/follen/sub2api:<version-tag>\n' >&2
  exit 1
fi
export SUB2API_IMAGE

set_env() {
  local key="$1"
  local value="$2"
  local escaped_value

  escaped_value="$(printf '%s' "$value" | sed 's/[\\&|]/\\\\&/g')"
  if grep -q "^${key}=" "$env_file"; then
    sed -i "s|^${key}=.*|${key}=${escaped_value}|" "$env_file"
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

read_bootstrap_b64() {
  local key="$1"
  local value

  value="$(sed -n "s/^${key}=//p" "$bootstrap_file" | tail -n 1)"
  test -n "$value"
  printf '%s' "$value" | base64 --decode
}

wait_for_container_health() {
  local container="$1"

  for _ in $(seq 1 30); do
    if [[ "$(docker inspect --format '{{.State.Health.Status}}' "$container")" == "healthy" ]]; then
      return
    fi
    sleep 2
  done

  test "$(docker inspect --format '{{.State.Health.Status}}' "$container")" = "healthy"
}

wait_for_all_health() {
  wait_for_container_health "$app_container"
  wait_for_container_health "$postgres_container"
  wait_for_container_health "$redis_container"
}

command -v docker >/dev/null
command -v openssl >/dev/null
command -v base64 >/dev/null
docker compose version >/dev/null

if [[ ! -f "$env_file" ]]; then
  test -s "$bootstrap_file"
  cp "$deploy_dir/quotajet.env.example" "$env_file"
  chmod 600 "$env_file"
  set_env ADMIN_EMAIL "$(read_bootstrap_b64 ADMIN_EMAIL_B64)"
  set_env ADMIN_PASSWORD "$(read_bootstrap_b64 ADMIN_PASSWORD_B64)"
  set_env POSTGRES_PASSWORD "$(generate_secret)"
  set_env REDIS_PASSWORD "$(generate_secret)"
  set_env JWT_SECRET "$(generate_secret)"
  set_env TOTP_ENCRYPTION_KEY "$(generate_secret)"
fi

set_env SUB2API_IMAGE "$SUB2API_IMAGE"
set_env BIND_HOST 127.0.0.1
set_env SERVER_PORT 8081
set_env SERVER_MODE release
set_env TZ Asia/Shanghai
chmod 600 "$env_file"

mkdir -p \
  /www/data/sub2api/quotajet-next \
  /www/data/postgres/quotajet-next \
  /www/data/redis/quotajet-next

postgres_user="$(read_env_value POSTGRES_USER)"
postgres_db="$(read_env_value POSTGRES_DB)"
postgres_user="${postgres_user:-sub2api}"
postgres_db="${postgres_db:-sub2api}"

docker compose --project-name "$project_name" "${compose_files[@]}" config >/dev/null
docker compose --project-name "$project_name" "${compose_files[@]}" pull
docker compose --project-name "$project_name" "${compose_files[@]}" up -d --remove-orphans
wait_for_all_health

docker exec -i "$postgres_container" psql -v ON_ERROR_STOP=1 -U "$postgres_user" -d "$postgres_db" <"$deploy_dir/quotajet-brand.sql"
site_name="$(docker exec -i "$postgres_container" psql -v ON_ERROR_STOP=1 -U "$postgres_user" -d "$postgres_db" -Atc "SELECT value FROM settings WHERE key = 'site_name'")"
site_logo="$(docker exec -i "$postgres_container" psql -v ON_ERROR_STOP=1 -U "$postgres_user" -d "$postgres_db" -Atc "SELECT value FROM settings WHERE key = 'site_logo'")"
if [[ "$site_name" != "QuotaJet" || "$site_logo" != "/logo.png" ]]; then
  printf 'QuotaJet brand settings were not persisted\n' >&2
  exit 1
fi

docker restart "$app_container" >/dev/null
wait_for_all_health

deployed_image="$(docker inspect --format '{{.Config.Image}}' "$app_container")"
if [[ "$deployed_image" != "$SUB2API_IMAGE" ]]; then
  printf 'deployed image does not match SUB2API_IMAGE\n' >&2
  exit 1
fi

docker compose --project-name "$project_name" "${compose_files[@]}" ps

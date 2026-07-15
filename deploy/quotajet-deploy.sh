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

docker compose --project-name quotajet-sub2api "${compose_files[@]}" up -d --build --remove-orphans
docker compose --project-name quotajet-sub2api "${compose_files[@]}" ps


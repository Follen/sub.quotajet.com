#!/usr/bin/env bash

set -Eeuo pipefail

project_name="quotajet-next"
app_container="quotajet-next"
postgres_container="postgres.quotajet-next"
redis_container="redis.quotajet-next"
deploy_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
env_file="$deploy_dir/.env"
bootstrap_file="$deploy_dir/.bootstrap.env"
staging_env_file=""
env_update_file=""
admin_email_file=""
admin_password_file=""
compose_files=(
  -f "$deploy_dir/docker-compose.local.yml"
  -f "$deploy_dir/docker-compose.quotajet.yml"
)

trap 'rm -f "$bootstrap_file" "${staging_env_file:-}" "${env_update_file:-}" "${admin_email_file:-}" "${admin_password_file:-}"' EXIT

cd "$deploy_dir"
umask 077

: "${SUB2API_IMAGE:?SUB2API_IMAGE is required}"
: "${SUB2API_VERSION:?SUB2API_VERSION is required}"
if [[ ! "$SUB2API_IMAGE" =~ ^ghcr\.io/follen/sub2api@sha256:[0-9a-f]{64}$ ]]; then
  printf 'SUB2API_IMAGE must match ghcr.io/follen/sub2api@sha256:<64 lowercase hex>\n' >&2
  exit 1
fi
semantic_version_regex='^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-(([A-Za-z][0-9A-Za-z-]*|[0-9]+[A-Za-z][0-9A-Za-z-]*)|0|[1-9][0-9]*)(\.(([A-Za-z][0-9A-Za-z-]*|[0-9]+[A-Za-z][0-9A-Za-z-]*)|0|[1-9][0-9]*))*)?$'
if [[ ! "$SUB2API_VERSION" =~ $semantic_version_regex ]]; then
  printf 'SUB2API_VERSION must be a normalized semantic version\n' >&2
  exit 1
fi
export SUB2API_IMAGE SUB2API_VERSION

set_env() {
  local file="$1"
  local key="$2"
  local value="$3"
  local escaped_value
  local found=0

  [[ "$value" != *$'\n'* && "$value" != *$'\r'* ]] || return 1
  escaped_value="${value//\'/\\\'}"
  env_update_file="$(mktemp "$file.update.XXXXXX")"
  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" == "$key="* ]]; then
      printf "%s='%s'\n" "$key" "$escaped_value"
      found=1
    else
      printf '%s\n' "$line"
    fi
  done <"$file" >"$env_update_file"
  if [[ "$found" -eq 0 ]]; then
    printf "%s='%s'\n" "$key" "$escaped_value" >>"$env_update_file"
  fi
  chmod 600 "$env_update_file"
  mv "$env_update_file" "$file"
  env_update_file=""
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
  local output_file="$2"
  local encoded

  if ! encoded="$(sed -n "s/^${key}=//p" "$bootstrap_file" | tail -n 1)"; then
    return 1
  fi
  [[ -n "$encoded" ]] || return 1
  if ! printf '%s' "$encoded" | base64 --decode >"$output_file"; then
    return 1
  fi
  [[ -s "$output_file" ]] || return 1
  LC_ALL=C tr -d '\r\n' <"$output_file" | cmp -s "$output_file" - || return 1
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
docker pull "$SUB2API_IMAGE"
image_version="$(docker image inspect --format '{{ index .Config.Labels "org.opencontainers.image.version" }}' "$SUB2API_IMAGE")"
if [[ "$image_version" != "$SUB2API_VERSION" ]]; then
  printf 'image OCI version label does not match SUB2API_VERSION\n' >&2
  exit 1
fi

if [[ ! -f "$env_file" ]]; then
  admin_email=""
  admin_password=""
  postgres_password=""
  redis_password=""
  jwt_secret=""
  totp_encryption_key=""
  test -s "$bootstrap_file"
  admin_email_file="$(mktemp "$deploy_dir/.admin-email.XXXXXX")"
  admin_password_file="$(mktemp "$deploy_dir/.admin-password.XXXXXX")"
  chmod 600 "$admin_email_file" "$admin_password_file"
  if ! read_bootstrap_b64 ADMIN_EMAIL_B64 "$admin_email_file"; then exit 1; fi
  if ! read_bootstrap_b64 ADMIN_PASSWORD_B64 "$admin_password_file"; then exit 1; fi
  admin_email="$(<"$admin_email_file")"
  admin_password="$(<"$admin_password_file")"
  if ! postgres_password="$(generate_secret)"; then exit 1; fi
  if ! redis_password="$(generate_secret)"; then exit 1; fi
  if ! jwt_secret="$(generate_secret)"; then exit 1; fi
  if ! totp_encryption_key="$(generate_secret)"; then exit 1; fi
  for secret in "$postgres_password" "$redis_password" "$jwt_secret" "$totp_encryption_key"; do
    [[ "$secret" =~ ^[0-9A-Fa-f]{64}$ ]]
  done

  staging_env_file="$(mktemp "$deploy_dir/.env.staging.XXXXXX")"
  cp "$deploy_dir/quotajet.env.example" "$staging_env_file"
  chmod 600 "$staging_env_file"
  set_env "$staging_env_file" ADMIN_EMAIL "$admin_email"
  set_env "$staging_env_file" ADMIN_PASSWORD "$admin_password"
  set_env "$staging_env_file" POSTGRES_PASSWORD "$postgres_password"
  set_env "$staging_env_file" REDIS_PASSWORD "$redis_password"
  set_env "$staging_env_file" JWT_SECRET "$jwt_secret"
  set_env "$staging_env_file" TOTP_ENCRYPTION_KEY "$totp_encryption_key"
else
  staging_env_file="$(mktemp "$deploy_dir/.env.staging.XXXXXX")"
  cp "$env_file" "$staging_env_file"
  chmod 600 "$staging_env_file"
fi

set_env "$staging_env_file" SUB2API_IMAGE "$SUB2API_IMAGE"
set_env "$staging_env_file" SUB2API_VERSION "$SUB2API_VERSION"
set_env "$staging_env_file" BIND_HOST 127.0.0.1
set_env "$staging_env_file" SERVER_PORT 8081
set_env "$staging_env_file" SERVER_MODE release
set_env "$staging_env_file" TZ Asia/Shanghai
chmod 600 "$staging_env_file"
mv "$staging_env_file" "$env_file"
staging_env_file=""

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
deployed_version="$(docker inspect --format '{{ index .Config.Labels "org.opencontainers.image.version" }}' "$app_container")"
if [[ "$deployed_version" != "$SUB2API_VERSION" ]]; then
  printf 'deployed image version does not match SUB2API_VERSION\n' >&2
  exit 1
fi

docker compose --project-name "$project_name" "${compose_files[@]}" ps

#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source_deploy_dir="$repo_root/deploy"
work_dir="$(mktemp -d)"
trap 'rm -rf "$work_dir"' EXIT

fail() {
  printf '%s\n' "$*" >&2
  exit 1
}

prepare_deploy_dir() {
  local case_dir="$1"

  cp -R "$source_deploy_dir" "$case_dir/deploy"
  printf 'ADMIN_EMAIL_B64=%s\nADMIN_PASSWORD_B64=%s\n' \
    "$(printf 'admin@example.com' | base64)" \
    "$(printf 'bootstrap-password' | base64)" >"$case_dir/deploy/.bootstrap.env"
}

make_fake_bin() {
  local case_dir="$1"

  mkdir -p "$case_dir/bin"
  cat >"$case_dir/bin/docker" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >>"$DOCKER_LOG"

if [[ "$1" == "compose" ]]; then
  [[ " $* " == *" version "* || " $* " == *" config "* || " $* " == *" pull "* || " $* " == *" up "* || " $* " == *" ps "* ]] && exit 0
fi

case "$1" in
  inspect)
    if [[ "$3" == "{{.State.Health.Status}}" ]]; then
      printf 'healthy\n'
    elif [[ "$3" == "{{.Config.Image}}" ]]; then
      printf '%s\n' "$SUB2API_IMAGE"
    else
      exit 1
    fi
    ;;
  exec)
    [[ "$3" == "postgres.quotajet-next" ]] || exit 1
    if [[ "$*" == *site_name* ]]; then
      printf 'QuotaJet\n'
    elif [[ "$*" == *site_logo* ]]; then
      printf '/logo.png\n'
    fi
    ;;
  restart) exit 0 ;;
  *) exit 1 ;;
esac
EOF
  cat >"$case_dir/bin/mkdir" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >>"$MKDIR_LOG"
EOF
  cat >"$case_dir/bin/sleep" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF
  chmod +x "$case_dir/bin/docker" "$case_dir/bin/mkdir" "$case_dir/bin/sleep"
}

run_deploy() {
  local case_dir="$1"
  local image="$2"

  PATH="$case_dir/bin:$PATH" DOCKER_LOG="$case_dir/docker.log" MKDIR_LOG="$case_dir/mkdir.log" \
    SUB2API_IMAGE="$image" bash "$case_dir/deploy/quotajet-deploy.sh"
}

assert_no_docker_or_env() {
  local case_dir="$1"

  test ! -e "$case_dir/deploy/.env" || fail "unexpected .env"
  test ! -e "$case_dir/deploy/.bootstrap.env" || fail "bootstrap file was not removed"
  test ! -e "$case_dir/docker.log" || fail "docker was invoked"
}

for image in 'not-a-registry/image:1.2.3' 'ghcr.io/follen/sub2api:latest'; do
  case_dir="$work_dir/invalid-${image//[^A-Za-z0-9]/-}"
  mkdir -p "$case_dir"
  prepare_deploy_dir "$case_dir"
  make_fake_bin "$case_dir"
  if run_deploy "$case_dir" "$image"; then
    fail "invalid image unexpectedly deployed: $image"
  fi
  assert_no_docker_or_env "$case_dir"
done

case_dir="$work_dir/openssl-failure"
mkdir -p "$case_dir"
prepare_deploy_dir "$case_dir"
make_fake_bin "$case_dir"
cat >"$case_dir/bin/failing-openssl" <<'EOF'
#!/usr/bin/env bash
exit 1
EOF
chmod +x "$case_dir/bin/failing-openssl"
mv "$case_dir/bin/failing-openssl" "$case_dir/bin/openssl"
if run_deploy "$case_dir" 'ghcr.io/follen/sub2api:1.2.3'; then
  fail "openssl failure unexpectedly deployed"
fi
test "$(stat -c '%a' "$case_dir/deploy/.env")" = 600 || fail ".env mode is not 600"
test ! -e "$case_dir/deploy/.bootstrap.env" || fail "bootstrap file was not removed"

case_dir="$work_dir/success"
mkdir -p "$case_dir"
prepare_deploy_dir "$case_dir"
make_fake_bin "$case_dir"
run_deploy "$case_dir" 'ghcr.io/follen/sub2api:1.2.3'
test ! -e "$case_dir/deploy/.bootstrap.env" || fail "bootstrap file was not removed"
test "$(grep -Fc 'inspect --format {{.State.Health.Status}} quotajet-next' "$case_dir/docker.log")" = 2 || fail "app health was not checked twice"
test "$(grep -Fc 'inspect --format {{.State.Health.Status}} postgres.quotajet-next' "$case_dir/docker.log")" = 2 || fail "postgres health was not checked twice"
test "$(grep -Fc 'inspect --format {{.State.Health.Status}} redis.quotajet-next' "$case_dir/docker.log")" = 2 || fail "redis health was not checked twice"
grep -Fq 'exec -i postgres.quotajet-next psql' "$case_dir/docker.log" || fail "branding did not use postgres.quotajet-next"
grep -Fq 'inspect --format {{.Config.Image}} quotajet-next' "$case_dir/docker.log" || fail "deployed image was not verified"

printf 'quotajet deploy bootstrap regression test passed\n'

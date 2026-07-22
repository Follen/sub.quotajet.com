#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source_deploy_dir="$repo_root/deploy"
work_dir="$(mktemp -d)"
trap 'rm -rf "$work_dir"' EXIT
valid_digest="sha256:$(printf 'a%.0s' {1..64})"
valid_image="ghcr.io/follen/sub2api@$valid_digest"
valid_version="1.2.3"

fail() {
  printf '%s\n' "$*" >&2
  exit 1
}

decode_compose_single_quoted_value() {
  local value="$1"
  local encoded
  local decoded=""
  local character
  local index=0

  [[ ${#value} -ge 2 && "${value:0:1}" == "'" && "${value: -1}" == "'" ]] || return 1
  encoded="${value:1:${#value}-2}"
  while [[ $index -lt ${#encoded} ]]; do
    character="${encoded:index:1}"
    if [[ "$character" == "\\" && $((index + 1)) -lt ${#encoded} && "${encoded:index+1:1}" == "'" ]]; then
      decoded+="'"
      index=$((index + 2))
    else
      decoded+="$character"
      index=$((index + 1))
    fi
  done
  printf '%s' "$decoded"
}

prepare_deploy_dir() {
  local case_dir="$1"
  local admin_email="${2:-admin@example.com}"
  local admin_password="${3:-bootstrap-password}"

  cp -R "$source_deploy_dir" "$case_dir/deploy"
  printf 'ADMIN_EMAIL_B64=%s\nADMIN_PASSWORD_B64=%s\n' \
    "$(printf '%s' "$admin_email" | base64)" \
    "$(printf '%s' "$admin_password" | base64)" >"$case_dir/deploy/.bootstrap.env"
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
  pull) exit 0 ;;
  image)
    [[ "$2" == "inspect" && "$3" == "--format" ]] || exit 1
    case "$4" in
      *version*) printf '%s\n' "${FAKE_IMAGE_VERSION:-$SUB2API_VERSION}" ;;
      *) exit 1 ;;
    esac
    ;;
  inspect)
    if [[ "$3" == "{{.State.Health.Status}}" ]]; then
      printf '%s\n' "${FAKE_HEALTH_STATUS:-healthy}"
    elif [[ "$3" == "{{.Config.Image}}" ]]; then
      printf '%s\n' "${FAKE_DEPLOYED_IMAGE:-$SUB2API_IMAGE}"
    elif [[ "$3" == *org.opencontainers.image.version* ]]; then
      printf '%s\n' "${FAKE_RUNNING_VERSION:-$SUB2API_VERSION}"
    else
      exit 1
    fi
    ;;
  exec)
    [[ "$3" == "postgres.quotajet-next" ]] || exit 1
    if [[ "$*" == *site_name* ]]; then
      printf '%s\n' "${FAKE_SITE_NAME:-QuotaJet}"
    elif [[ "$*" == *site_logo* ]]; then
      printf '%s\n' "${FAKE_SITE_LOGO:-/logo.png}"
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
  local version="$3"

  env PATH="$case_dir/bin:$PATH" DOCKER_LOG="$case_dir/docker.log" MKDIR_LOG="$case_dir/mkdir.log" \
    SUB2API_IMAGE="$image" SUB2API_VERSION="$version" "${@:4}" bash "$case_dir/deploy/quotajet-deploy.sh"
}

run_deploy_stream() {
  local case_dir="$1"
  local image="$2"
  local version="$3"
  local input_file="$4"

  env PATH="$case_dir/bin:$PATH" DOCKER_LOG="$case_dir/docker.log" MKDIR_LOG="$case_dir/mkdir.log" \
    SUB2API_IMAGE="$image" SUB2API_VERSION="$version" QUOTAJET_BOOTSTRAP_STDIN=1 "${@:5}" \
    bash "$case_dir/deploy/quotajet-deploy.sh" <"$input_file"
}

assert_failure_output() {
  local case_dir="$1"
  local expected="$2"

  grep -Fq "$expected" "$case_dir/output" || fail "expected failure diagnostic was missing: $expected"
}

assert_no_docker_or_env() {
  local case_dir="$1"

  test ! -e "$case_dir/deploy/.env" || fail "unexpected .env"
  test ! -e "$case_dir/deploy/.bootstrap.env" || fail "bootstrap file was not removed"
  test ! -e "$case_dir/docker.log" || fail "docker was invoked"
}

assert_no_credential_temp_files() {
  local case_dir="$1"

  if compgen -G "$case_dir/deploy/.admin-*" >/dev/null; then
    fail "credential temp file was not removed"
  fi
  if compgen -G "$case_dir/deploy/.bootstrap.env.stdin.*" >/dev/null; then
    fail "bootstrap stream temp file was not removed"
  fi
}

trap_line="$(grep -n -m1 "^trap .*bootstrap_file" "$source_deploy_dir/quotajet-deploy.sh" | cut -d: -f1 || true)"
stream_read_line="$(grep -n -m1 'cat >"\$bootstrap_file"' "$source_deploy_dir/quotajet-deploy.sh" | cut -d: -f1 || true)"
[[ -n "$trap_line" && -n "$stream_read_line" && "$trap_line" -lt "$stream_read_line" ]] || \
  fail "bootstrap cleanup trap must be installed before stdin is read"

for image in \
  'not-a-registry/image:1.2.3' \
  'ghcr.io/follen/sub2api:latest' \
  'ghcr.io/follen/sub2api:1.2.3' \
  'ghcr.io/follen/sub2api@sha256:ABCDEF' \
  'ghcr.io/follen/sub2api@sha256:not-a-digest' \
  "ghcr.io/other/sub2api@$valid_digest"; do
  case_dir="$work_dir/invalid-${image//[^A-Za-z0-9]/-}"
  mkdir -p "$case_dir"
  prepare_deploy_dir "$case_dir"
  make_fake_bin "$case_dir"
  if run_deploy "$case_dir" "$image" "$valid_version" >"$case_dir/output" 2>&1; then
    fail "invalid image unexpectedly deployed: $image"
  fi
  assert_failure_output "$case_dir" 'SUB2API_IMAGE must match ghcr.io/follen/sub2api@sha256:<64 lowercase hex>'
  assert_no_docker_or_env "$case_dir"
done

for version in v1.2.3 latest 1.2 00.1.2 1.2.3-01 '1.2.3--'; do
  case_dir="$work_dir/invalid-version-${version//[^A-Za-z0-9]/-}"
  mkdir -p "$case_dir"
  prepare_deploy_dir "$case_dir"
  make_fake_bin "$case_dir"
  if run_deploy "$case_dir" "$valid_image" "$version" >"$case_dir/output" 2>&1; then
    fail "invalid expected version unexpectedly deployed: $version"
  fi
  assert_failure_output "$case_dir" 'SUB2API_VERSION must be a normalized semantic version'
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
if run_deploy "$case_dir" "$valid_image" "$valid_version" >"$case_dir/output" 2>&1; then
  fail "openssl failure unexpectedly deployed"
fi
assert_failure_output "$case_dir" 'failed to generate deployment secrets'
test ! -e "$case_dir/deploy/.env" || fail "openssl failure left a partial .env"
test ! -e "$case_dir/deploy/.bootstrap.env" || fail "bootstrap file was not removed"
assert_no_credential_temp_files "$case_dir"

case_dir="$work_dir/invalid-base64"
mkdir -p "$case_dir"
prepare_deploy_dir "$case_dir"
printf 'ADMIN_EMAIL_B64=not-base64\nADMIN_PASSWORD_B64=%s\n' \
  "$(printf 'bootstrap-password' | base64)" >"$case_dir/deploy/.bootstrap.env"
make_fake_bin "$case_dir"
if run_deploy "$case_dir" "$valid_image" "$valid_version" >"$case_dir/output" 2>&1; then
  fail "invalid base64 unexpectedly deployed"
fi
assert_failure_output "$case_dir" 'bootstrap credentials are invalid'
test ! -e "$case_dir/deploy/.env" || fail "invalid base64 left a partial .env"
test ! -e "$case_dir/deploy/.bootstrap.env" || fail "bootstrap file was not removed"
assert_no_credential_temp_files "$case_dir"

for line_break in trailing-lf trailing-cr; do
  case_dir="$work_dir/$line_break"
  mkdir -p "$case_dir"
  case "$line_break" in
    trailing-lf) invalid_email=$'admin@example.com\n' ;;
    trailing-cr) invalid_email=$'admin@example.com\r' ;;
  esac
  prepare_deploy_dir "$case_dir" "$invalid_email"
  make_fake_bin "$case_dir"
  if run_deploy "$case_dir" "$valid_image" "$valid_version" >"$case_dir/output" 2>&1; then
    fail "$line_break base64 unexpectedly deployed"
  fi
  assert_failure_output "$case_dir" 'bootstrap credentials are invalid'
  test ! -e "$case_dir/deploy/.env" || fail "$line_break base64 left a partial .env"
  test ! -e "$case_dir/deploy/.bootstrap.env" || fail "bootstrap file was not removed"
  assert_no_credential_temp_files "$case_dir"
done

for failure in image-version-mismatch unhealthy wrong-site-name wrong-site-logo image-mismatch running-version-mismatch; do
  case_dir="$work_dir/$failure"
  mkdir -p "$case_dir"
  prepare_deploy_dir "$case_dir"
  make_fake_bin "$case_dir"
  case "$failure" in
    image-version-mismatch)
      extra_env=(FAKE_IMAGE_VERSION=9.9.9)
      expected_message='image OCI version label does not match SUB2API_VERSION'
      ;;
    unhealthy)
      extra_env=(FAKE_HEALTH_STATUS=unhealthy)
      expected_message='container quotajet-next did not become healthy'
      ;;
    wrong-site-name)
      extra_env=(FAKE_SITE_NAME=WrongSite)
      expected_message='QuotaJet brand settings were not persisted'
      ;;
    wrong-site-logo)
      extra_env=(FAKE_SITE_LOGO=/wrong-logo.png)
      expected_message='QuotaJet brand settings were not persisted'
      ;;
    image-mismatch)
      extra_env=(FAKE_DEPLOYED_IMAGE="ghcr.io/follen/sub2api@sha256:$(printf 'b%.0s' {1..64})")
      expected_message='deployed image does not match SUB2API_IMAGE'
      ;;
    running-version-mismatch)
      extra_env=(FAKE_RUNNING_VERSION=9.9.9)
      expected_message='deployed image version does not match SUB2API_VERSION'
      ;;
  esac
  if run_deploy "$case_dir" "$valid_image" "$valid_version" "${extra_env[@]}" >"$case_dir/output" 2>&1; then
    fail "$failure unexpectedly deployed"
  fi
  assert_failure_output "$case_dir" "$expected_message"
  test ! -e "$case_dir/deploy/.bootstrap.env" || fail "bootstrap file was not removed"
done

case_dir="$work_dir/success"
mkdir -p "$case_dir"
special_email='admin$WORD${WORD}\path\'"'"'quoted&|@example.com'
special_password='pass$WORD${WORD}\plain\'"'"'quoted&|value'
prepare_deploy_dir "$case_dir" "$special_email" "$special_password"
make_fake_bin "$case_dir"
run_deploy "$case_dir" "$valid_image" "$valid_version"
test ! -e "$case_dir/deploy/.bootstrap.env" || fail "bootstrap file was not removed"
assert_no_credential_temp_files "$case_dir"
test "$(stat -c '%a' "$case_dir/deploy/.env")" = 600 || fail ".env mode is not 600"
stored_email="$(sed -n 's/^ADMIN_EMAIL=//p' "$case_dir/deploy/.env")"
stored_password="$(sed -n 's/^ADMIN_PASSWORD=//p' "$case_dir/deploy/.env")"
[[ "$stored_email" == "'"*"'" ]] || fail "admin email dotenv value is not single-quoted"
[[ "$stored_password" == "'"*"'" ]] || fail "admin password dotenv value is not single-quoted"
printf '%s\n' "$stored_email" | grep -Fq "\\'" || fail "admin email single quote was not escaped"
printf '%s\n' "$stored_email" | grep -Fq '\path' || fail "admin email ordinary backslash was not preserved"
test "$(decode_compose_single_quoted_value "$stored_email")" = "$special_email" || fail "admin email special characters did not round-trip"
test "$(decode_compose_single_quoted_value "$stored_password")" = "$special_password" || fail "admin password special characters did not round-trip"
test "$(grep -Fc 'inspect --format {{.State.Health.Status}} quotajet-next' "$case_dir/docker.log")" = 2 || fail "app health was not checked twice"
test "$(grep -Fc 'inspect --format {{.State.Health.Status}} postgres.quotajet-next' "$case_dir/docker.log")" = 2 || fail "postgres health was not checked twice"
test "$(grep -Fc 'inspect --format {{.State.Health.Status}} redis.quotajet-next' "$case_dir/docker.log")" = 2 || fail "redis health was not checked twice"
grep -Fq 'exec -i postgres.quotajet-next psql' "$case_dir/docker.log" || fail "branding did not use postgres.quotajet-next"
grep -Fq 'inspect --format {{.Config.Image}} quotajet-next' "$case_dir/docker.log" || fail "deployed image was not verified"
grep -Fq "SUB2API_IMAGE='$valid_image'" "$case_dir/deploy/.env" || fail "digest image was not persisted"
grep -Fq "SUB2API_VERSION='$valid_version'" "$case_dir/deploy/.env" || fail "expected version was not persisted"
grep -Fq 'inspect --format {{ index .Config.Labels "org.opencontainers.image.version" }} quotajet-next' "$case_dir/docker.log" || fail "running version metadata was not verified"

case_dir="$work_dir/stdin-success"
mkdir -p "$case_dir"
prepare_deploy_dir "$case_dir" 'stream-admin@example.com' 'stream-password'
mv "$case_dir/deploy/.bootstrap.env" "$case_dir/bootstrap.input"
printf 'stale-bootstrap-file\n' >"$case_dir/deploy/.bootstrap.env"
make_fake_bin "$case_dir"
run_deploy_stream "$case_dir" "$valid_image" "$valid_version" "$case_dir/bootstrap.input"
test ! -e "$case_dir/deploy/.bootstrap.env" || fail "stdin bootstrap created the legacy bootstrap path"
assert_no_credential_temp_files "$case_dir"
grep -Fq "ADMIN_EMAIL='stream-admin@example.com'" "$case_dir/deploy/.env" || fail "stdin admin email was not persisted"
grep -Fq "ADMIN_PASSWORD='stream-password'" "$case_dir/deploy/.env" || fail "stdin admin password was not persisted"

for invalid_stream in missing-password invalid-base64 truncated; do
  case_dir="$work_dir/stdin-$invalid_stream"
  mkdir -p "$case_dir"
  prepare_deploy_dir "$case_dir"
  rm "$case_dir/deploy/.bootstrap.env"
  make_fake_bin "$case_dir"
  case "$invalid_stream" in
    missing-password)
      printf 'ADMIN_EMAIL_B64=%s\n' "$(printf 'admin@example.com' | base64)" >"$case_dir/bootstrap.input"
      ;;
    invalid-base64)
      printf 'ADMIN_EMAIL_B64=not-base64\nADMIN_PASSWORD_B64=%s\n' \
        "$(printf 'stream-password' | base64)" >"$case_dir/bootstrap.input"
      ;;
    truncated)
      printf 'ADMIN_EMAIL_B64=%s\nADMIN_PASSWORD_B64=' \
        "$(printf 'admin@example.com' | base64)" >"$case_dir/bootstrap.input"
      ;;
  esac
  if run_deploy_stream "$case_dir" "$valid_image" "$valid_version" "$case_dir/bootstrap.input" >"$case_dir/output" 2>&1; then
    fail "invalid bootstrap stream unexpectedly deployed: $invalid_stream"
  fi
  assert_failure_output "$case_dir" 'bootstrap stream is invalid'
  test ! -e "$case_dir/deploy/.env" || fail "invalid bootstrap stream created .env: $invalid_stream"
  assert_no_credential_temp_files "$case_dir"
  ! grep -Fq 'admin@example.com' "$case_dir/output" || fail "bootstrap credential leaked in diagnostics"
  ! grep -Fq 'stream-password' "$case_dir/output" || fail "bootstrap credential leaked in diagnostics"
done

case_dir="$work_dir/stdin-invalid-existing-env"
mkdir -p "$case_dir"
prepare_deploy_dir "$case_dir"
rm "$case_dir/deploy/.bootstrap.env"
printf 'EXISTING=preserved\n' >"$case_dir/deploy/.env"
printf 'ADMIN_EMAIL_B64=%s\n' "$(printf 'admin@example.com' | base64)" >"$case_dir/bootstrap.input"
make_fake_bin "$case_dir"
if run_deploy_stream "$case_dir" "$valid_image" "$valid_version" "$case_dir/bootstrap.input" >"$case_dir/output" 2>&1; then
  fail "invalid bootstrap stream unexpectedly deployed with an existing env"
fi
assert_failure_output "$case_dir" 'bootstrap stream is invalid'
test "$(<"$case_dir/deploy/.env")" = 'EXISTING=preserved' || fail "invalid bootstrap stream changed the existing env"
assert_no_credential_temp_files "$case_dir"

printf 'quotajet deploy bootstrap regression test passed\n'

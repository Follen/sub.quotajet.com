#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
workflow_file="$repo_root/.github/workflows/deploy-quotajet.yml"
work_dir="$(mktemp -d)"
trap 'rm -rf "$work_dir"' EXIT

fail() {
  printf '%s\n' "$*" >&2
  exit 1
}

validation_step="$(awk '
  /^      - name: Validate release and image$/ { in_step = 1; next }
  in_step && /^      - name:/ { exit }
  in_step && /^        run: \|$/ { in_run = 1; next }
  in_run {
    if ($0 == "") next
    if (substr($0, 1, 10) != "          ") exit 1
    print substr($0, 11)
  }
' "$workflow_file")"
test -n "$validation_step" || fail "Validate release and image step was not found"

upload_step="$(awk '
  /^      - name: Upload deployment artifacts$/ { in_step = 1; next }
  in_step && /^      - name:/ { exit }
  in_step && /^        run: \|$/ { in_run = 1; next }
  in_run {
    if ($0 == "") next
    if (substr($0, 1, 10) != "          ") exit 1
    print substr($0, 11)
  }
' "$workflow_file")"
test -n "$upload_step" || fail "Upload deployment artifacts step was not found"

run_deploy_step="$(awk '
  /^      - name: Run production deployment$/ { in_step = 1; next }
  in_step && /^      - name:/ { exit }
  in_step && /^        run: \|$/ { in_run = 1; next }
  in_run {
    if ($0 == "") next
    if (substr($0, 1, 10) != "          ") exit
    print substr($0, 11)
  }
' "$workflow_file")"
test -n "$run_deploy_step" || fail "Run production deployment step was not found"

checkout_line="$(grep -n -m1 '^      - name: Checkout release$' "$workflow_file" | cut -d: -f1)"
validation_line="$(grep -n -m1 '^      - name: Validate release and image$' "$workflow_file" | cut -d: -f1)"
ssh_line="$(grep -n -m1 '^      - name: Configure SSH$' "$workflow_file" | cut -d: -f1)"
bootstrap_line="$(grep -n -m1 '^      - name: Create bootstrap values$' "$workflow_file" | cut -d: -f1)"
[[ "$checkout_line" -lt "$validation_line" && "$validation_line" -lt "$ssh_line" && "$validation_line" -lt "$bootstrap_line" ]] || \
  fail "source and image validation must precede SSH and bootstrap steps"

origin="$work_dir/origin.git"
source_repo="$work_dir/source"
git init --bare --initial-branch=main "$origin" >/dev/null
git init --initial-branch=main "$source_repo" >/dev/null
git -C "$source_repo" config user.name test
git -C "$source_repo" config user.email test@example.com
printf 'main\n' >"$source_repo/file"
git -C "$source_repo" add file
git -C "$source_repo" commit -m main >/dev/null
main_commit="$(git -C "$source_repo" rev-parse HEAD)"
git -C "$source_repo" tag v1.2.3
git -C "$source_repo" remote add origin "$origin"
git -C "$source_repo" push origin main v1.2.3 >/dev/null
git -C "$source_repo" switch -c side >/dev/null
printf 'side\n' >>"$source_repo/file"
git -C "$source_repo" commit -am side >/dev/null
git -C "$source_repo" tag v2.0.0
git -C "$source_repo" push origin v2.0.0 >/dev/null

checkout="$work_dir/checkout"
git clone "$origin" "$checkout" >/dev/null
mkdir -p "$work_dir/bin"
cat >"$work_dir/bin/docker" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >>"$DOCKER_LOG"
if [[ "$1" == pull ]]; then
  exit 0
fi
if [[ "$1 $2" == 'image inspect' && "$3" == '--format' ]]; then
  case "$4" in
    *version*) printf '%s\n' "${FAKE_IMAGE_VERSION:-1.2.3}" ;;
    *revision*) printf '%s\n' "${FAKE_IMAGE_REVISION:?FAKE_IMAGE_REVISION is required}" ;;
    *) exit 1 ;;
  esac
  exit 0
fi
exit 1
EOF
chmod +x "$work_dir/bin/docker"

digest="sha256:$(printf 'a%.0s' {1..64})"

run_validation() {
  local tag="$1"
  local candidate_digest="$2"
  shift 2

  env PATH="$work_dir/bin:$PATH" DOCKER_LOG="$work_dir/docker.log" RELEASE_TAG="$tag" \
    IMAGE_DIGEST="$candidate_digest" DEFAULT_BRANCH=main GITHUB_OUTPUT="$work_dir/output" \
    FAKE_IMAGE_REVISION="$main_commit" "$@" \
    bash -c "cd \"\$1\" && $validation_step" _ "$checkout"
}

assert_rejected() {
  local tag="$1"
  local candidate_digest="$2"
  local expected_message="$3"
  shift 3

  : >"$work_dir/output"
  : >"$work_dir/docker.log"
  if run_validation "$tag" "$candidate_digest" "$@" 2>"$work_dir/error"; then
    fail "invalid deployment source unexpectedly passed: $tag $candidate_digest"
  fi
  grep -Fq "$expected_message" "$work_dir/error" || fail "unexpected deployment validation failure"
  test ! -s "$work_dir/output" || fail "invalid deployment source produced outputs"
}

assert_rejected '1.2.3' "$digest" 'release tag must match v<semantic-version>'
assert_rejected 'v1.2.3' 'sha256:not-a-digest' 'image digest must match sha256:<64 lowercase hex>'
assert_rejected 'v2.0.0' "$digest" 'release tag commit is not reachable from origin/main'
assert_rejected 'v1.2.3' "$digest" 'OCI version label does not match release version' FAKE_IMAGE_VERSION=9.9.9
assert_rejected 'v1.2.3' "$digest" 'OCI revision label does not match release commit' FAKE_IMAGE_REVISION="$(printf 'b%.0s' {1..40})"

: >"$work_dir/output"
: >"$work_dir/docker.log"
run_validation 'v1.2.3' "$digest"
grep -Fxq "image=ghcr.io/follen/sub2api@$digest" "$work_dir/output" || fail "digest image output is missing"
grep -Fxq 'version=1.2.3' "$work_dir/output" || fail "normalized version output is missing"
grep -Fxq "tag_commit=$main_commit" "$work_dir/output" || fail "tag commit output is missing"
grep -Fq "pull ghcr.io/follen/sub2api@$digest" "$work_dir/docker.log" || fail "validated digest was not pulled"

test "$(grep -Fc 'deploy/docker-compose.local.yml' "$workflow_file")" -ge 1 || fail "local Compose file is not uploaded"
test "$(grep -Fc 'deploy/docker-compose.quotajet.yml' "$workflow_file")" -ge 1 || fail "QuotaJet Compose file is not uploaded"
test "$(grep -Fc 'deploy/quotajet.env.example' "$workflow_file")" -ge 1 || fail "env template is not uploaded"
test "$(grep -Fc 'deploy/quotajet-brand.sql' "$workflow_file")" -ge 1 || fail "brand SQL is not uploaded"
test "$(grep -Fc 'deploy/quotajet-deploy.sh' "$workflow_file")" -ge 1 || fail "deploy script is not uploaded"
if grep -Fq '.bootstrap.env' <<<"$upload_step"; then
  fail "bootstrap credentials must not be retained on the host by the SCP step"
fi
grep -Fq 'QUOTAJET_BOOTSTRAP_STDIN=1' <<<"$run_deploy_step" || fail "remote deployment does not opt into bootstrap stdin"
grep -Fq '< .bootstrap.env' <<<"$run_deploy_step" || fail "bootstrap credentials are not streamed into the deployment SSH session"
grep -Fq 'if: ${{ always() }}' "$workflow_file" || fail "local bootstrap cleanup is not unconditional"
grep -Fq 'rm -f .bootstrap.env' "$workflow_file" || fail "local bootstrap cleanup is missing"

printf 'quotajet deployment workflow regression test passed\n'

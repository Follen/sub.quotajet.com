#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
workflow_file="$repo_root/.github/workflows/release.yml"
work_dir="$(mktemp -d)"
trap 'rm -rf "$work_dir"' EXIT

fail() {
  printf '%s\n' "$*" >&2
  exit 1
}

extract_run_step() {
  local step_name="$1"

  awk -v target="$step_name" '
    $0 == "      - name: " target { in_step = 1; next }
    in_step && /^      - name:/ { exit }
    in_step && /^        run: \|$/ { in_run = 1; next }
    in_run {
      if ($0 == "") next
      if (substr($0, 1, 10) != "          ") exit
      print substr($0, 11)
    }
  ' "$workflow_file"
}

validation_step="$(extract_run_step 'Validate release source')"
test -n "$validation_step" || fail "Validate release source step was not found"

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
printf 'main-2\n' >>"$source_repo/file"
git -C "$source_repo" commit -am main-2 >/dev/null
git -C "$source_repo" push origin main >/dev/null
git -C "$source_repo" switch -c side >/dev/null
printf 'side\n' >>"$source_repo/file"
git -C "$source_repo" commit -am side >/dev/null
git -C "$source_repo" tag v2.0.0
git -C "$source_repo" push origin v2.0.0 >/dev/null

checkout="$work_dir/checkout"
git clone "$origin" "$checkout" >/dev/null

assert_rejected() {
  local tag="$1"
  local expected_message="$2"
  local output_file="$work_dir/output"
  local error_file="$work_dir/error"

  : >"$output_file"
  if RELEASE_TAG="$tag" DEFAULT_BRANCH=main GITHUB_OUTPUT="$output_file" \
    bash -c "cd \"\$1\" && $validation_step" _ "$checkout" 2>"$error_file"; then
    fail "invalid release source unexpectedly passed: $tag"
  fi
  grep -Fq "$expected_message" "$error_file" || fail "unexpected validation failure for $tag"
  test ! -s "$output_file" || fail "invalid release source produced outputs: $tag"
}

assert_rejected '1.2.3' 'release tag must match v<semantic-version>'
assert_rejected 'v1.2' 'release tag must match v<semantic-version>'
assert_rejected 'v2.0.0' 'release tag commit is not reachable from origin/main'
assert_rejected 'v9.9.9' 'release tag does not exist'
assert_rejected 'v1.2.3' 'checked out commit does not match release tag'

output_file="$work_dir/output"
: >"$output_file"
git -C "$checkout" checkout --detach v1.2.3 >/dev/null
RELEASE_TAG=v1.2.3 DEFAULT_BRANCH=main GITHUB_OUTPUT="$output_file" \
  bash -c "cd \"\$1\" && $validation_step" _ "$checkout"
grep -Fxq 'release_tag=v1.2.3' "$output_file" || fail "canonical release tag output is missing"
grep -Fxq 'version=1.2.3' "$output_file" || fail "normalized version output is missing"
grep -Fxq "tag_commit=$main_commit" "$output_file" || fail "tag commit output is missing"

test "$(grep -Fc 'ref: ${{ needs.validate-release.outputs.release_tag }}' "$workflow_file")" = 3 || \
  fail "all three release-producing jobs must checkout the canonical release tag"
test "$(grep -Fc 'EXPECTED_COMMIT: ${{ needs.validate-release.outputs.tag_commit }}' "$workflow_file")" = 3 || \
  fail "all three release-producing jobs must verify the validated tag commit"
grep -Fq 'image_digest: ${{ steps.image.outputs.digest }}' "$workflow_file" || fail "release job does not expose the published digest"
grep -Fq 'release_tag: ${{ needs.validate-release.outputs.release_tag }}' "$workflow_file" || fail "deployment does not receive the canonical release tag"
grep -Fq 'image_digest: ${{ needs.release.outputs.image_digest }}' "$workflow_file" || fail "deployment does not receive the published digest"

printf 'quotajet release workflow regression test passed\n'

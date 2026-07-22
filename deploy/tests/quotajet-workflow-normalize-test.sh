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

normalize_step="$(awk '
  /^      - name: Normalize image tag$/ { in_step = 1; next }
  in_step && /^      - name:/ { exit }
  in_step && /^        run: \|$/ { in_run = 1; next }
  in_run {
    if ($0 == "") next
    if (substr($0, 1, 10) != "          ") exit 1
    print substr($0, 11)
  }
' "$workflow_file")"
test -n "$normalize_step" || fail "Normalize image tag step was not found"

normalize_line="$(grep -n -m1 '^      - name: Normalize image tag$' "$workflow_file" | cut -d: -f1)"
ssh_line="$(grep -n -m1 '^      - name: Configure SSH$' "$workflow_file" | cut -d: -f1)"
bootstrap_line="$(grep -n -m1 '^      - name: Create bootstrap values$' "$workflow_file" | cut -d: -f1)"
[[ "$normalize_line" -lt "$ssh_line" && "$normalize_line" -lt "$bootstrap_line" ]] || fail "normalization must precede SSH and bootstrap steps"

assert_rejected() {
  local tag="$1"
  local output_file="$work_dir/output"

  : >"$output_file"
  if IMAGE_TAG="$tag" GITHUB_OUTPUT="$output_file" bash -c "$normalize_step"; then
    fail "invalid image tag unexpectedly passed normalization: $tag"
  fi
  test ! -s "$output_file" || fail "invalid image tag produced an image output: $tag"
}

assert_normalized() {
  local tag="$1"
  local expected="$2"
  local output_file="$work_dir/output"

  : >"$output_file"
  IMAGE_TAG="$tag" GITHUB_OUTPUT="$output_file" bash -c "$normalize_step"
  test "$(<"$output_file")" = "image=ghcr.io/follen/sub2api:$expected" || fail "image tag was not normalized as expected: $tag"
}

for tag in latest 1.2 example vlatest v1.2 vexample 00.1.162 0.1.162-01 0.1.162--; do
  assert_rejected "$tag"
done

assert_normalized 'v0.1.162-qj.1' '0.1.162-qj.1'

printf 'quotajet workflow normalization regression test passed\n'

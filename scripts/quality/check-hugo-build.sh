#!/usr/bin/env bash
set -euo pipefail

log_file=$(mktemp)
trap 'rm -f "$log_file"' EXIT

hugo --gc --minify 2>&1 | tee "$log_file"

if grep -qi '^WARN' "$log_file"; then
  echo "Hugo build produced warnings, treat as failures." >&2
  exit 1
fi

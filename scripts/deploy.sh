#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ ${EUID:-$(id -u)} -eq 0 ]]; then
  echo "Do not run pnpm deploy with sudo. Use a regular user; the stack script will sudo docker when needed." >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required" >&2
  exit 1
fi

if [[ ! -f "$ROOT_DIR/.env" && -f "$ROOT_DIR/.env.example" ]]; then
  cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
  echo "created .env from .env.example"
fi

pnpm install --frozen-lockfile
bash "$ROOT_DIR/scripts/start.sh"

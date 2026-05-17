#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_DIR="$ROOT_DIR/.margo/pids"
COMPOSE_FILE="$ROOT_DIR/infra/docker-compose.yml"

if [[ ${EUID:-$(id -u)} -eq 0 ]]; then
  echo "Do not run pnpm stop with sudo. The script uses sudo only for docker when needed." >&2
  exit 1
fi

stop_pid_file() {
  local pid_file="$1"
  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file")"
    if kill -0 "$pid" 2>/dev/null; then
      kill -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
      sleep 1
      kill -9 -- "-$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$pid_file"
  fi
}

stop_matching_processes() {
  local name="$1"
  local pattern="$2"
  local pids
  pids="$(pgrep -f "$pattern" 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    echo "stopping orphaned $name processes..."
    while read -r pid; do
      [[ -z "$pid" ]] && continue
      kill "$pid" 2>/dev/null || true
    done <<<"$pids"
    sleep 1
    while read -r pid; do
      [[ -z "$pid" ]] && continue
      kill -9 "$pid" 2>/dev/null || true
    done <<<"$pids"
  fi
}

stop_pid_file "$PID_DIR/api.pid"
stop_pid_file "$PID_DIR/public-web.pid"
stop_pid_file "$PID_DIR/admin-web.pid"
stop_matching_processes "admin-web" "$ROOT_DIR/apps/admin-web/.+next dev.+--port 3001"
stop_matching_processes "public-web" "$ROOT_DIR/apps/public-web/.+next dev.+--port 3000"
stop_matching_processes "api" "$ROOT_DIR/apps/api/.+(tsx|vite|node|next).+3002"

if command -v docker >/dev/null 2>&1; then
  if docker info >/dev/null 2>&1; then
    docker compose -f "$COMPOSE_FILE" down
  elif command -v sudo >/dev/null 2>&1; then
    sudo docker compose -f "$COMPOSE_FILE" down
  fi
fi

rm -rf "$PID_DIR" "$ROOT_DIR/.margo/logs"

echo "MARGO stack stopped."

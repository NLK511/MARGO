#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_DIR="$ROOT_DIR/.margo/pids"
LOG_DIR="$ROOT_DIR/.margo/logs"
COMPOSE_FILE="$ROOT_DIR/infra/docker-compose.yml"

if [[ ${EUID:-$(id -u)} -eq 0 ]]; then
  echo "Do not run pnpm start with sudo." >&2
  exit 1
fi

mkdir -p "$PID_DIR" "$LOG_DIR"

if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
fi

start_background() {
  local name="$1"
  local command="$2"
  local pid_file="$PID_DIR/$name.pid"
  local log_file="$LOG_DIR/$name.log"

  if [[ -f "$pid_file" ]]; then
    local existing_pid
    existing_pid="$(cat "$pid_file")"
    if kill -0 "$existing_pid" 2>/dev/null; then
      echo "$name already running (pid $existing_pid)"
      return
    fi
  fi

  echo "starting $name..."
  setsid bash -lc "cd '$ROOT_DIR' && exec $command" >"$log_file" 2>&1 &
  echo $! >"$pid_file"
}

DOCKER_COMPOSE=(docker compose)
if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required for the local stack" >&2
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo "docker daemon is not available for the local stack" >&2
  exit 1
fi

docker_compose() {
  "${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" "$@"
}

echo "starting docker services..."
docker_compose up -d --build postgres redis worker

echo "waiting for postgres..."
until docker_compose exec -T postgres pg_isready -U margo -d margo >/dev/null 2>&1; do
  sleep 2
done

echo "running migrations..."
pnpm --dir "$ROOT_DIR" db:migrate

echo "seeding database..."
pnpm --dir "$ROOT_DIR" db:seed

echo "starting app processes..."
start_background "api" "pnpm --filter @margo/api dev"
start_background "public-web" "pnpm --filter @margo/public-web dev"
start_background "admin-web" "pnpm --filter @margo/admin-web dev"

echo

echo "MARGO stack started."
echo "  Public web: http://localhost:3000"
echo "  Admin web:  http://localhost:3001"
echo "  API:        http://localhost:3002"
echo "  Worker:     docker compose service"

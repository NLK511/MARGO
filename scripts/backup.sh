#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${MARGO_BACKUP_DIR:-$ROOT_DIR/.margo/backups/$(date -u +%Y%m%dT%H%M%SZ)}"
COMPOSE_FILE="$ROOT_DIR/infra/docker-compose.yml"
mkdir -p "$BACKUP_DIR"

if command -v docker >/dev/null 2>&1 && docker compose -f "$COMPOSE_FILE" ps postgres >/dev/null 2>&1; then
  docker compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U "${POSTGRES_USER:-margo}" "${POSTGRES_DB:-margo}" > "$BACKUP_DIR/postgres.sql"
else
  echo "Docker compose postgres service is not running; skipping pg_dump." >&2
fi

if [ -d "$ROOT_DIR/apps/admin-web/public/uploads" ]; then
  tar -czf "$BACKUP_DIR/uploads-admin-web.tgz" -C "$ROOT_DIR/apps/admin-web/public" uploads
fi
if [ -d "$ROOT_DIR/apps/public-web/public/uploads" ]; then
  tar -czf "$BACKUP_DIR/uploads-public-web.tgz" -C "$ROOT_DIR/apps/public-web/public" uploads
fi

cat > "$BACKUP_DIR/manifest.json" <<JSON
{"kind":"margo.local-backup","createdAt":"$(date -u +%Y-%m-%dT%H:%M:%SZ)","contains":["postgres.sql","uploads"]}
JSON

echo "Backup written to $BACKUP_DIR"

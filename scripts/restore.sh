#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: bash scripts/restore.sh <backup-dir>" >&2
  exit 2
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$1"
COMPOSE_FILE="$ROOT_DIR/infra/docker-compose.yml"

if [ ! -d "$BACKUP_DIR" ]; then
  echo "Backup directory not found: $BACKUP_DIR" >&2
  exit 1
fi

if [ -f "$BACKUP_DIR/postgres.sql" ]; then
  docker compose -f "$COMPOSE_FILE" up -d postgres
  docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "${POSTGRES_USER:-margo}" "${POSTGRES_DB:-margo}" < "$BACKUP_DIR/postgres.sql"
fi

if [ -f "$BACKUP_DIR/uploads-admin-web.tgz" ]; then
  mkdir -p "$ROOT_DIR/apps/admin-web/public"
  tar -xzf "$BACKUP_DIR/uploads-admin-web.tgz" -C "$ROOT_DIR/apps/admin-web/public"
fi
if [ -f "$BACKUP_DIR/uploads-public-web.tgz" ]; then
  mkdir -p "$ROOT_DIR/apps/public-web/public"
  tar -xzf "$BACKUP_DIR/uploads-public-web.tgz" -C "$ROOT_DIR/apps/public-web/public"
fi

echo "Restore completed from $BACKUP_DIR"

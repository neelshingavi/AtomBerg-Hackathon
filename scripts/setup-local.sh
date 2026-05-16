#!/usr/bin/env bash
# Local development bootstrap — Docker Postgres OR native PostgreSQL on :5432
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

log() { printf '\n▸ %s\n' "$*"; }
die() { printf '\n✗ %s\n' "$*" >&2; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

ensure_env() {
  if [[ ! -f .env.local ]]; then
    log "Creating .env.local from .env.example"
    cp .env.example .env.local
  fi

  # shellcheck disable=SC1091
  set -a
  source .env.local
  set +a

  if [[ -z "${AUTH_SECRET:-}" || -z "${NEXTAUTH_SECRET:-}" ]]; then
    local secret
    secret="$(openssl rand -base64 32)"
    log "Generating AUTH_SECRET / NEXTAUTH_SECRET"
    {
      grep -q '^AUTH_SECRET=' .env.local && sed -i '' 's|^AUTH_SECRET=.*|AUTH_SECRET="'"$secret"'"|' .env.local || echo "AUTH_SECRET=\"$secret\"" >> .env.local
      grep -q '^NEXTAUTH_SECRET=' .env.local && sed -i '' 's|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET="'"$secret"'"|' .env.local || echo "NEXTAUTH_SECRET=\"$secret\"" >> .env.local
    } 2>/dev/null || {
      # Linux sed (no backup suffix)
      grep -q '^AUTH_SECRET=' .env.local && sed -i 's|^AUTH_SECRET=.*|AUTH_SECRET="'"$secret"'"|' .env.local || echo "AUTH_SECRET=\"$secret\"" >> .env.local
      grep -q '^NEXTAUTH_SECRET=' .env.local && sed -i 's|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET="'"$secret"'"|' .env.local || echo "NEXTAUTH_SECRET=\"$secret\"" >> .env.local
    }
  fi

  if [[ -z "${CRON_SECRET:-}" ]]; then
    local cron
    cron="$(openssl rand -base64 24)"
    echo "CRON_SECRET=\"$cron\"" >> .env.local
  fi

  grep -q '^NEXT_PUBLIC_AZURE_AD_ENABLED=' .env.local || echo 'NEXT_PUBLIC_AZURE_AD_ENABLED="false"' >> .env.local
}

wait_for_postgres() {
  local host="${1:-127.0.0.1}"
  local port="${2:-5432}"
  local tries=30
  log "Waiting for PostgreSQL at ${host}:${port}..."
  for ((i = 1; i <= tries; i++)); do
    if command -v pg_isready >/dev/null 2>&1 && pg_isready -h "$host" -p "$port" -q 2>/dev/null; then
      return 0
    fi
    if (echo >/dev/tcp/"$host"/"$port") >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  die "PostgreSQL not reachable at ${host}:${port}. Start Docker (docker compose up -d) or local Postgres."
}

start_database() {
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    log "Starting Postgres via Docker Compose"
    docker compose up -d
    wait_for_postgres 127.0.0.1 5432
    return
  fi

  log "Docker unavailable — using native PostgreSQL on :5432"
  wait_for_postgres 127.0.0.1 5432

  if command -v psql >/dev/null 2>&1; then
    if ! psql -h 127.0.0.1 -p 5432 -U postgres -d atomquest -c 'SELECT 1' >/dev/null 2>&1; then
      log "Creating database 'atomquest' (if missing)"
      psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'atomquest'" | grep -q 1 \
        || psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -c 'CREATE DATABASE atomquest;' \
        || true
    fi
  fi
}

main() {
  require_cmd node
  require_cmd npm
  require_cmd openssl
  require_cmd npx

  ensure_env
  start_database

  log "Installing dependencies"
  npm install

  log "Applying Prisma schema"
  npx prisma db push

  log "Seeding demo data"
  npm run db:seed

  log "Verifying seed"
  npm run verify:seed

  if lsof -ti :3000 >/dev/null 2>&1; then
    die "Port 3000 is in use. Stop the running dev server (npm run dev) before setup runs a production build."
  fi

  log "Running production build"
  rm -rf .next
  npm run build

  echo ""
  echo "══════════════════════════════════════════════════════════════"
  echo "  Setup complete"
  echo "  Run:  npm run dev"
  echo "  URL:  http://localhost:3000"
  echo "  Login: employee@demo.com / password123 (see README for all 9 demo accounts)"
  echo "══════════════════════════════════════════════════════════════"
  echo ""
}

main "$@"

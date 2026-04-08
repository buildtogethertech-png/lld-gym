#!/usr/bin/env bash
# Deploy LLD Gym to Vercel — staging (Preview) vs production.
#
# === One-time setup ===
# 1. Install CLI: npm i -g vercel && vercel login
# 2. Link this repo to a Vercel project: vercel link  →  .vercel/project.json
# 3. Postgres: separate databases for staging and production (e.g. two Neon DBs). No ?schema= on URLs.
# 4. Vercel → Settings → Environment Variables:
#    - Production: prod DATABASE_URL, NEXTAUTH_URL (https://<prod-domain>), secrets, Razorpay (live when ready), etc.
#    - Preview:    staging DATABASE_URL, NEXTAUTH_URL (https://<staging>.vercel.app or your preview alias), test keys, etc.
#      Preview vars apply to `vercel deploy` without --prod (what this script calls “staging”).
# 5. Google OAuth: add both redirect URIs:
#      https://<staging-host>/api/auth/callback/google
#      https://<prod-host>/api/auth/callback/google
# 6. Local env files (gitignored): `.env.staging` and `.env.production` with DATABASE_URL (and optional VERCEL_ORG_ID /
#    VERCEL_PROJECT_ID if you use a second Vercel project for staging — overrides .vercel/project.json for that deploy).
#
# === Commands ===
#   ./scripts/deploy-vercel.sh staging
#   ./scripts/deploy-vercel.sh production
#   ./scripts/deploy-vercel.sh staging --no-build
#   ./scripts/deploy-vercel.sh production --no-migrate
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

TARGET=""
SKIP_BUILD=0
SKIP_MIGRATE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    staging|production)
      TARGET="$1"
      shift
      ;;
    --no-build)
      SKIP_BUILD=1
      shift
      ;;
    --no-migrate)
      SKIP_MIGRATE=1
      shift
      ;;
    -h|--help)
      cat <<'EOF'
Usage:
  ./scripts/deploy-vercel.sh staging|production [options]

staging   — prisma migrate against DB in .env.staging (via DEPLOY_MIGRATE_TARGET), then Preview deploy (vercel deploy, not --prod).
production — prisma migrate with NODE_ENV=production (.env.production), then production deploy (vercel --prod).

Options:
  --no-build    Skip npm run build
  --no-migrate  Skip prisma migrate deploy

npm:
  npm run deploy:vercel:staging
  npm run deploy:vercel:production

See script header comments for Vercel env (Preview vs Production) and OAuth URLs.
EOF
      exit 0
      ;;
    *)
      echo "Unknown argument: $1 (use: staging | production | --help)" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$TARGET" ]]; then
  echo "Specify target: staging or production (see: $0 --help)" >&2
  exit 1
fi

if ! command -v vercel >/dev/null 2>&1; then
  echo "Vercel CLI not found. Install: npm i -g vercel" >&2
  exit 1
fi

if [[ ! -f .vercel/project.json ]]; then
  echo "Project not linked. Run: vercel link" >&2
  exit 1
fi

if [[ "$SKIP_MIGRATE" -eq 0 ]]; then
  case "$TARGET" in
    staging)
      if [[ -f .env.staging ]]; then
        echo "==> prisma migrate deploy (staging DB — DEPLOY_MIGRATE_TARGET=staging)"
        DEPLOY_MIGRATE_TARGET=staging npx prisma migrate deploy
      else
        echo "==> Skip migrate: create .env.staging with DATABASE_URL, or run:" >&2
        echo "    DEPLOY_MIGRATE_TARGET=staging npx prisma migrate deploy" >&2
      fi
      ;;
    production)
      if [[ -f .env.production ]]; then
        echo "==> prisma migrate deploy (production DB — NODE_ENV=production)"
        NODE_ENV=production npx prisma migrate deploy
      else
        echo "==> Skip migrate: no .env.production (add DATABASE_URL there or run migrate manually)." >&2
      fi
      ;;
  esac
fi

if [[ "$SKIP_BUILD" -eq 0 ]]; then
  echo "==> npm run build (local sanity check)"
  npm run build
fi

case "$TARGET" in
  staging)
    if [[ -f .env.staging ]]; then
      set -a
      # shellcheck disable=SC1091
      source .env.staging
      set +a
    fi
    echo "==> vercel deploy (Preview — use Preview env vars in Vercel dashboard)"
    exec vercel deploy --yes
    ;;
  production)
    if [[ -f .env.production ]]; then
      set -a
      # shellcheck disable=SC1091
      source .env.production
      set +a
    fi
    echo "==> vercel deploy --prod"
    exec vercel deploy --prod --yes
    ;;
esac

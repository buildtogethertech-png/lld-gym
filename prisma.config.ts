// Loads env like Next.js so `npx prisma migrate deploy` picks up local DATABASE_URL from
// `.env.development` when you don't have a root `.env`. Runtime (Next/Vercel) still uses process.env.
import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import { defineConfig } from "prisma/config";

const root = process.cwd();

function load(file: string, override: boolean) {
  loadEnv({ path: resolve(root, file), override });
}

// Order matches Next: later files win. `override: true` only after base `.env` so a
// pre-set DATABASE_URL (e.g. CI/Vercel) is never replaced by dotenv unless a later file applies.
load(".env", false);
load(".env.local", true);

if (process.env.NODE_ENV === "production") {
  load(".env.production", true);
  load(".env.production.local", true);
} else {
  load(".env.development", true);
  load(".env.development.local", true);
}

// `scripts/deploy-vercel.sh staging` sets this so `migrate deploy` uses the staging DB
// (otherwise `.env.development` would override DATABASE_URL).
if (process.env.DEPLOY_MIGRATE_TARGET === "staging") {
  load(".env.staging", true);
  load(".env.staging.local", true);
}

const BUILD_TIME_DB_URL =
  process.env.DATABASE_URL?.trim() ||
  "postgresql://build:build@127.0.0.1:5432/build";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: BUILD_TIME_DB_URL,
  },
});

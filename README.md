This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy (Vercel)

1. Push this repo to GitHub (or connect a local folder in the [Vercel dashboard](https://vercel.com/new)).
2. **Environment variables** — add every key from `.env.example` for production. Important:
   - `DATABASE_URL` — hosted Postgres (Neon, Supabase, RDS, …). Use a **dedicated database per environment** (e.g. `lld-gym-production`); tables use the default `public` schema (no `?schema=` needed).
   - `NEXTAUTH_URL` — your live site URL, e.g. `https://your-app.vercel.app` (must match the URL users open).
   - `NEXTAUTH_SECRET` — long random string (e.g. `openssl rand -base64 32`).
   - Google OAuth: add the production **Authorized redirect URI** `https://<your-domain>/api/auth/callback/google`.
   - Razorpay: `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` only. The checkout script gets the key id from the create-order API response. Optional: `RAZORPAY_WEBHOOK_SECRET` for webhooks.
3. **Database (greenfield)** — schema lives only in `prisma/schema.prisma`. With `DATABASE_URL` pointing at the target DB (local or hosted), run once:
   ```bash
   npm run db:push
   ```
   (`migrate deploy` is optional if you rely on the checked-in migration history; for a brand-new database, `db push` is enough.)
4. Redeploy after changing env vars. The build runs `prisma generate && next build` (`vercel.json` defaults region to **Mumbai `bom1`** for lower latency in India).

CLI: `npx vercel` (link project), then `npx vercel --prod` for production.

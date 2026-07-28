# Health Tracker

A personal, self-hosted health dashboard combining weight, body composition
(InBody), bloodwork, nutrition (MyFitnessPal), and workout/activity data, plus
weight and exercise goals. Single-user, protected by Google OAuth.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind)
- Postgres via Prisma 7 (driver adapter: `@prisma/adapter-pg`)
- Auth.js (NextAuth v5) with Google OAuth, restricted to one allowed email

## Data sources

Apple Health, MyFitnessPal, InBody, and bloodwork labs don't expose a shared
API, so data gets in one of two ways:

- **Manual entry** — weight, InBody scans, and bloodwork panels are typed in
  directly (`/log/weight`, `/log/inbody`, `/log/bloodwork`), since those
  usually only exist as printouts/PDFs anyway.
- **CSV import** (`/import`) — a generic uploader: pick a CSV, tell it what
  kind of data it is, map its columns to our fields, and optionally save the
  mapping as a reusable preset. Works for MyFitnessPal's own CSV export
  (Progress → Export Data) and any workout/steps CSV from an Apple Health
  export tool (e.g. "Health Auto Export").

## Local development

1. Have a local Postgres running and set `DATABASE_URL` in `.env` (see
   `.env.example`).
2. `npm install` (runs `prisma generate` via `postinstall`)
3. `npx prisma migrate dev` to apply the schema
4. Create a Google OAuth client (https://console.cloud.google.com/apis/credentials),
   redirect URI `http://localhost:3000/api/auth/callback/google`, and set
   `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` / `AUTH_SECRET` / `ALLOWED_EMAIL`
   in `.env`.
5. `npm run dev`

## Deployment

A `Dockerfile` and `fly.toml` are included for Fly.io; the same image works
on Railway or any other Docker host. On first deploy:

1. Provision a Postgres database and set `DATABASE_URL`.
2. Set `AUTH_SECRET`, `ALLOWED_EMAIL`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
   as secrets/env vars (see `.env.example`).
3. Add `<your-deployed-url>/api/auth/callback/google` as an authorized
   redirect URI on the Google OAuth client.
4. The Fly release step (`npx prisma migrate deploy`) applies pending
   migrations before each deploy; run it manually on other hosts if they
   don't support a release/pre-deploy command.

`/api/health` is an unauthenticated health-check endpoint for the platform's
load balancer.

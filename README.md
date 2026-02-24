# VexaChat

## Prisma is the source of truth for database schema

All application tables are defined only in `prisma/schema.prisma` and managed through Prisma migrations in `prisma/migrations`.
Do **not** create or alter app tables manually in the Supabase SQL editor.

Core Prisma models include:
`Profile`, `Favorite`, `UserProfile`, `FriendRequest`, `UserBlock`, `Notification`, `Conversation`, `Message`, `ChatMedia`, `VerificationRequest`, `MeetCard`, `MeetLikeRequest`, `MeetMatch`, `MeetNotification`, `MeetPass`, `MeetBlock`, `HomeSection`, `HomePageConfig`, `HomepageImage`.

## Production database configuration (Supabase Postgres)

- `DATABASE_URL` must point to your **Supabase Postgres connection string** in production.
- Prisma runtime and migrations use only `DATABASE_URL`.
- Keep using production-safe Prisma flow:
  - `prisma migrate deploy`
  - `npm run start:prod` or `npm run start:prod:safe`
- Do **not** use `prisma migrate dev` or `prisma db push` in production.

## One-time migration: Render Postgres -> Supabase Postgres

This repo includes an idempotent copy script at `scripts/migrate-render-to-supabase.js`.

### Required environment variables

- `SOURCE_DATABASE_URL` = old Render Postgres URL
- `TARGET_DATABASE_URL` = new Supabase Postgres URL

### Steps

1. **Apply schema on Supabase (target) via Prisma migrations**

```bash
DATABASE_URL="$TARGET_DATABASE_URL" npx prisma migrate deploy
```

2. **Copy data from Render to Supabase**

```bash
node scripts/migrate-render-to-supabase.js
```

The script:
- connects to both databases,
- prints per-table row counts before and after,
- copies records model-by-model in FK-safe order,
- preserves IDs and timestamps,
- uses `createMany(..., skipDuplicates: true)` for idempotent re-runs,
- syncs serial/identity sequences when present,
- exits non-zero on failure.

3. **Verify counts without copying (optional)**

```bash
npm run db:verify:counts
```

4. **Switch production**
- Set production `DATABASE_URL` to `TARGET_DATABASE_URL` (Supabase).
- Redeploy.

### Convenience script

```bash
npm run db:migrate:to-supabase
```

This runs Prisma migrations against `TARGET_DATABASE_URL` and then executes the copy script.

## Fixing Prisma P3009 in production

Use this when deploy logs show:

- `P3009 migrate found failed migrations`
- failed migration: `20260227090000_add_meet_mvp`

### 1) Confirm status

```bash
npm run db:status
```

### 2) Run one-time DB repair (preferred, Prisma-native)

```bash
npm run db:repair
```

The repair script will:

- connect with `DATABASE_URL`
- check `_prisma_migrations`
- print last 10 migration rows
- detect failed `20260227090000_add_meet_mvp`
- try `prisma migrate resolve --rolled-back 20260227090000_add_meet_mvp`
- run `prisma migrate deploy`

### 3) SQL fallback only if Prisma resolve cannot run

> Backup your database first.

```bash
npm run db:repair -- --confirm-sql-repair
```

Optional cleanup for partially-created meet MVP tables:

```bash
npm run db:repair -- --confirm-sql-repair --drop-meet-tables
```

## Deployment commands

- Build Command:

```bash
npm install && npm run build
```

- Start Command:

```bash
npm run start:prod
```

This keeps build independent from database migrations while guaranteeing `prisma migrate deploy` runs right before `next start` in production.

## Chat TTL cleanup cron (Render)

Conversations expire exactly 15 days after they start (`startedAt + 15 days`) and are excluded from chat APIs once expired.
To permanently remove expired conversations/messages from the database, configure Render Cron:

- Endpoint: `POST https://<your-domain>/api/cron/cleanup-chats`
- Header: `x-cron-secret: <CRON_SECRET>`
- Schedule: daily (example: `0 3 * * *` for 03:00)

Required environment variable:

- `CRON_SECRET=<random-long-secret>`

## Ephemeral chat media cron (Render)

Image and video chat media are stored in Cloudflare R2 and cleaned after their TTL:

- images: 6 hours
- videos: 2 hours

Configure Render Cron to call:

- Endpoint: `POST https://<your-domain>/api/cron/cleanup-media`
- Header: `x-cron-secret: <CRON_SECRET>`
- Schedule: every 10 minutes (example: `*/10 * * * *`)

Required environment variables:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_ENDPOINT`
- `CRON_SECRET`

### Cloudflare R2 storage configuration

Required environment variables:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_ENDPOINT` (must be account endpoint only, no bucket), e.g. `https://<accountid>.r2.cloudflarestorage.com`

`R2_ENDPOINT` must **not** include the bucket in host or path.
Correct: `https://<accountid>.r2.cloudflarestorage.com`
Incorrect: `https://<bucket>.<accountid>.r2.cloudflarestorage.com` or `https://<accountid>.r2.cloudflarestorage.com/<bucket>`

For browser-based presigned PUT uploads, configure your R2 bucket CORS:

- Allowed methods: `PUT`, `GET`, `HEAD`, `OPTIONS`
- Allowed headers: `Content-Type`
- Allowed origins: your deployed app origin (Render) and `http://localhost:3000` for local development

Storage diagnostics endpoint (protected by `CRON_SECRET`):

- Endpoint: `GET /api/storage/health`
- Header: `x-cron-secret: <CRON_SECRET>`

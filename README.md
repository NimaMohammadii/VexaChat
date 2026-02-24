# VexaChat

## Fixing Prisma P3009 on Render Postgres

Use this when Render deploy logs show:

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

> Backup your Render Postgres DB first.

```bash
npm run db:repair -- --confirm-sql-repair
```

Optional cleanup for partially-created meet MVP tables:

```bash
npm run db:repair -- --confirm-sql-repair --drop-meet-tables
```

### Render production workflow

- Build Command:

```bash
npm install && npm run build
```

- Start Command:

```bash
npm run start:prod
```

This keeps build independent from database migrations while guaranteeing `prisma migrate deploy` runs right before `next start` in production.


## Render deployment settings for Homepage Manager

Homepage Manager depends on Prisma migration `20260302120000_add_home_sections`.
If this migration is not applied, `/api/admin/home-sections` will fail and Admin → Homepage Manager will not load.

### Required environment variables

- `DATABASE_URL`: set this to your **Render Internal Postgres URL**.
- `DIRECT_URL`: set this only if your Prisma schema/environment explicitly uses `DIRECT_URL`.

### Render commands

- Build Command:

```bash
npm install && npm run build
```

- Start Command (recommended):

```bash
npm run start:prod
```

This runs `prisma migrate deploy` before starting Next.js.

- Start Command (safe auto-repair option):

```bash
npm run start:prod:safe
```

Use this if you want startup to run the Prisma repair script first for fresh/misaligned databases, then start Next.js.

## Chat TTL cleanup cron (Render)

Conversations expire exactly 15 days after they start (`startedAt + 15 days`) and are excluded from chat APIs once expired.
To permanently remove expired conversations/messages from the database, configure Render Cron:

- Endpoint: `POST https://<your-domain>/api/cron/cleanup-chats`
- Header: `x-cron-secret: <CRON_SECRET>`
- Schedule: daily (example: `0 3 * * *` for 03:00)

Required environment variable:

- `CRON_SECRET=<random-long-secret>`

## Ephemeral chat media cron (Render)

Image and video chat media are stored in Supabase Storage bucket `chat-media` and cleaned after their TTL:

- images: 6 hours
- videos: 2 hours

Configure Render Cron to call:

- Endpoint: `POST https://<your-domain>/api/cron/cleanup-media`
- Header: `x-cron-secret: <CRON_SECRET>`
- Schedule: every 10 minutes (example: `*/10 * * * *`)

Required environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY` (if used by your client stack)
- `CRON_SECRET`

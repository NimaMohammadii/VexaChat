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

## Chat TTL cleanup cron

Conversations expire exactly 15 days after they start (`startedAt + 15 days`) and are excluded from chat APIs once expired.
To permanently remove expired conversations/messages from the database, configure your cron service:

- Endpoint: `POST https://<your-domain>/api/cron/cleanup-chats`
- Header: `x-cron-secret: <CRON_SECRET>`
- Schedule: daily (example: `0 3 * * *` for 03:00)

Required environment variable:

- `CRON_SECRET=<random-long-secret>`

## Ephemeral chat media cron

Image and video chat media are stored in Cloudflare R2 and cleaned after their TTL:

- images: 6 hours
- videos: 2 hours

Configure cron to call:

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
- Allowed origins: your deployed app origin and `http://localhost:3000` for local development

Storage diagnostics endpoint (protected by `CRON_SECRET`):

- Endpoint: `GET /api/storage/health`
- Header: `x-cron-secret: <CRON_SECRET>`

## Storage is R2-only

Supabase is used only for auth/session. All user-uploaded files (avatars, profile images, meet images, verification docs, chat media, homepage section images, homepage hero images) must be stored as **R2 object keys** in the database.

### Required storage environment variables (Render)

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_ENDPOINT`

### One-time migration: Supabase Storage URLs -> R2 keys

1. Deploy code and run Prisma migrations:

```bash
npm run db:deploy
```

2. Run the storage migration script (idempotent/restartable):

```bash
npm run storage:migrate-supabase-to-r2
```

Script requirements:

- `DATABASE_URL`
- `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY`
- all `R2_*` vars above

What the script migrates:

- `userProfile.avatarUrl`
- `profile.imageUrl`, `profile.images[]`
- `meetCard.imageUrl`
- `verificationRequest.docUrls[]`
- `homeSection.imageUrl`
- `homepageImage.url` and `homepageImage.data` -> `homepageImage.storagePath` (R2 key)
- `chatMedia.storageKey` / `chatMedia.url` if legacy URLs are found

3. Deploy with R2 vars present in production.

4. Confirm cleanup using script report:

- verification counts for `storage/v1/object` and `supabase` references should be `0`.
- all migrated DB values should now be R2 keys (not URLs).

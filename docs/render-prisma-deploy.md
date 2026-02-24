# Render + Prisma + Supabase Postgres Production Deployment

This project is configured for **production-safe Prisma migrations** while deploying the app on Render and running the database on Supabase Postgres.

## Service commands

- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm start`

`npm start` runs the safe production flow (`start:prod:safe`) which:
1. Repairs a previously failed migration (P3009) when present.
2. Runs `prisma migrate deploy` against the database from `DATABASE_URL`.
3. Starts `next start`.

> Do not use `prisma migrate dev` in production.
> Do not use `prisma db push` in production.

## Required environment variables

- `DATABASE_URL` → **Supabase PostgreSQL** connection string used by Prisma runtime and migrations.

Supabase Auth/Storage env vars (`NEXT_PUBLIC_SUPABASE_*`) are still separate from Prisma DB access.
Prisma DB access uses only `DATABASE_URL`.

## One-time database move (Render Postgres -> Supabase)

1. Set:
   - `SOURCE_DATABASE_URL` = old Render Postgres URL
   - `TARGET_DATABASE_URL` = new Supabase Postgres URL
2. Apply Prisma migrations to target:
   ```bash
   DATABASE_URL="$TARGET_DATABASE_URL" npx prisma migrate deploy
   ```
3. Run copy:
   ```bash
   node scripts/migrate-render-to-supabase.js
   ```
4. Verify counts (optional):
   ```bash
   npm run db:verify:counts
   ```
5. Switch production `DATABASE_URL` to Supabase and redeploy.

## P3009 recovery without data loss

If deploy fails with `P3009` (failed migration recorded), do **not** reset or drop the database.

1. Inspect migration status:
   ```bash
   npx prisma migrate status
   ```
2. Resolve only the failed migration as rolled back:
   ```bash
   npx prisma migrate resolve --rolled-back "<failed_migration_name>"
   ```
3. Re-run production deploy migration:
   ```bash
   npx prisma migrate deploy
   ```

This flow clears the blocked migration state safely and keeps production data intact.

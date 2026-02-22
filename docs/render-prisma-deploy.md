# Render + Prisma + PostgreSQL Production Deployment

This project is configured for **production-safe Prisma migrations** on Render.

## Render service commands

- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm start`

`npm start` runs the safe production flow (`start:prod:safe`) which:
1. Repairs a previously failed migration (P3009) when present.
2. Runs `prisma migrate deploy` against the production Render Postgres DB.
3. Starts `next start`.

> Do not use `prisma migrate dev` in production.
> Do not use `prisma db push` in production.

## Required environment variables

- `DATABASE_URL` → Render PostgreSQL connection string used by Prisma runtime and migrations.

Supabase should remain scoped to Auth/Storage env vars only (`NEXT_PUBLIC_SUPABASE_*`).
Prisma uses only `DATABASE_URL`.

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

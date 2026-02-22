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

- Build command should keep `prisma generate` before `next build`.
- Prefer running migrations as a separate pre-deploy job/step:

```bash
npm run db:deploy
```

- If migrations must be in Start Command, use:

```bash
npx prisma migrate deploy && npm run start
```

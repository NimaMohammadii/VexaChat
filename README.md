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

# VexaChat

## Environment variables
- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` (optional, defaults to `profile-images`)
- `SECRET_KEY`

## Database commands
- Generate Prisma client: `npm run db:generate`
- Apply migrations: `npm run db:migrate`
- Optional seed: `npm run db:seed`

## Render deploy
- Build command: `npm install && npm run build`
- Start command: `npm run start`
- Post-deploy migration command: `npx prisma migrate deploy`

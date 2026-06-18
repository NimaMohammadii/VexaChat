# Cloudflare Workers deployment

This project can be deployed to Cloudflare Workers through OpenNext.

## What changed for Cloudflare

- `wrangler.jsonc` points Cloudflare Workers to `.open-next/worker.js` and `.open-next/assets`.
- `open-next.config.ts` enables the OpenNext Cloudflare adapter.
- `package.json` includes Cloudflare scripts:
  - `npm run cf:build`
  - `npm run cf:preview`
  - `npm run cf:deploy`
- `lib/prisma.ts` uses `@prisma/client/edge` with `@prisma/extension-accelerate`.

## Required Cloudflare secrets

Set these in Cloudflare Workers before deploy:

```bash
npx wrangler secret put DATABASE_URL
npx wrangler secret put NEXT_PUBLIC_SUPABASE_URL
npx wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put R2_ACCOUNT_ID
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
npx wrangler secret put R2_BUCKET_NAME
npx wrangler secret put R2_ENDPOINT
npx wrangler secret put CRON_SECRET
```

Use the existing optional app secrets too if those features are enabled, such as Agora or admin secrets.

## Telegram Mini App

Only one Telegram secret is required:

```bash
npx wrangler secret put BOT_TOKEN
```

The Mini App URL, menu button text, and setup code are hardcoded in `app/api/telegram/setup-mini-app/route.ts`.

After deploy, call the setup endpoint once:

```bash
curl -X POST "https://chaty.vexaagent.workers.dev/api/telegram/setup-mini-app?code=vexa-mini-app-setup"
```

This calls Telegram `setChatMenuButton` and sets the bot menu button to open the deployed VexaChat app as a Telegram Mini App.

## Important database note

Cloudflare Workers cannot run the normal Node Prisma query engine. Use a Prisma Accelerate / edge-compatible `DATABASE_URL` for the deployed Worker.

Keep running migrations from a Node environment, for example locally or CI:

```bash
npm run db:deploy
```

Do not run `next start` on Cloudflare Workers. Use OpenNext instead.

## Deploy

```bash
npm install
npm run db:deploy
npm run cf:build
npm run cf:deploy
```

## Local preview through Workers runtime

```bash
npm run cf:preview
```

## Cloudflare dashboard settings

If deploying from the Cloudflare dashboard, use:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Output directory: leave empty; Wrangler reads `.open-next` from `wrangler.jsonc`.

## Existing Render/Node deployment

The old Node deployment scripts remain in `package.json`:

- `npm run start:prod`
- `npm run start:prod:safe`

Those are still useful for Render or another Node server, but they are not used by Cloudflare Workers.

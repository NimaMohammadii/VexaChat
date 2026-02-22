#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const { spawnSync } = require('node:child_process');

const TARGET_MIGRATION = '20260227090000_add_meet_mvp';

/** @typedef {{id: string, migration_name: string, started_at: Date | null, finished_at: Date | null, rolled_back_at: Date | null, logs: string | null}} MigrationRow */

const args = new Set(process.argv.slice(2));
const allowSqlRepair = args.has('--confirm-sql-repair');
const dropMeetTables = args.has('--drop-meet-tables');

function runCommand(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32'
  });

  return result.status === 0;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('[db:repair] DATABASE_URL is required.');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    console.log('[db:repair] Connecting to database...');
    await prisma.$connect();

    /** @type {{regclass: string | null}[]} */
    const tableExistsRows = await prisma.$queryRaw`
      SELECT to_regclass('public._prisma_migrations') AS regclass
    `;

    const migrationsTableExists = tableExistsRows.length > 0 && tableExistsRows[0].regclass !== null;

    if (!migrationsTableExists) {
      console.log('[db:repair] _prisma_migrations does not exist yet. Running migrate deploy...');
      const deployed = runCommand('npx', ['prisma', 'migrate', 'deploy']);
      process.exit(deployed ? 0 : 1);
    }

    /** @type {MigrationRow[]} */
    const recentRows = await prisma.$queryRaw`
      SELECT id, migration_name, started_at, finished_at, rolled_back_at, logs
      FROM "_prisma_migrations"
      ORDER BY started_at DESC
      LIMIT 10
    `;

    console.log('[db:repair] Last 10 migration rows (newest first):');
    if (recentRows.length === 0) {
      console.log('  (no rows found)');
    } else {
      for (const row of recentRows) {
        const summary = {
          id: row.id,
          migration_name: row.migration_name,
          started_at: row.started_at,
          finished_at: row.finished_at,
          rolled_back_at: row.rolled_back_at,
          logs: row.logs ? `${row.logs.slice(0, 120)}${row.logs.length > 120 ? '…' : ''}` : null
        };
        console.log(`  ${JSON.stringify(summary)}`);
      }
    }

    /** @type {{failed_count: bigint | number}[]} */
    const failedRows = await prisma.$queryRaw`
      SELECT COUNT(*)::bigint AS failed_count
      FROM "_prisma_migrations"
      WHERE migration_name = ${TARGET_MIGRATION}
        AND finished_at IS NULL
    `;

    const failedCountValue = failedRows[0]?.failed_count ?? 0;
    const failedCount = typeof failedCountValue === 'bigint' ? Number(failedCountValue) : Number(failedCountValue);
    const hasFailedMigration = failedCount > 0;

    if (hasFailedMigration) {
      console.log(`[db:repair] Found failed migration row for ${TARGET_MIGRATION}.`);
      console.log('[db:repair] Attempting Prisma-native repair: prisma migrate resolve --rolled-back ...');

      const resolved = runCommand('npx', ['prisma', 'migrate', 'resolve', '--rolled-back', TARGET_MIGRATION]);

      if (!resolved) {
        console.warn('[db:repair] Prisma migrate resolve failed in this environment.');
        console.warn('[db:repair] SAFE SQL fallback is available but requires explicit confirmation.');
        console.warn('[db:repair] IMPORTANT: Take a DB backup/snapshot before using SQL fallback.');

        if (!allowSqlRepair) {
          console.error('[db:repair] Re-run with --confirm-sql-repair to delete only the failed migration row.');
          process.exit(1);
        }

        console.warn('[db:repair] Proceeding with SQL fallback after explicit confirmation flag.');

        const deleted = await prisma.$executeRaw`
          DELETE FROM "_prisma_migrations"
          WHERE migration_name = ${TARGET_MIGRATION}
            AND finished_at IS NULL
        `;
        console.log(`[db:repair] Deleted ${deleted} failed migration row(s) for ${TARGET_MIGRATION}.`);

        if (dropMeetTables) {
          console.warn('[db:repair] --drop-meet-tables enabled: dropping partial Meet MVP tables if they exist.');
          await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "MeetCard" CASCADE');
          await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "MeetLike" CASCADE');
          await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "MeetPass" CASCADE');
          await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "MeetBlock" CASCADE');
          await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "MeetReport" CASCADE');
          console.log('[db:repair] Optional Meet MVP table cleanup complete.');
        }
      }
    } else {
      console.log(`[db:repair] No failed row found for ${TARGET_MIGRATION}.`);
    }

    console.log('[db:repair] Running prisma migrate deploy...');
    const deployed = runCommand('npx', ['prisma', 'migrate', 'deploy']);
    process.exit(deployed ? 0 : 1);
  } catch (error) {
    console.error('[db:repair] Unexpected error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

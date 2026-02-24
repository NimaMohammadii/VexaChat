#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");

const TABLES = [
  { model: "UserProfile", delegate: "userProfile", table: "UserProfile" },
  { model: "Profile", delegate: "profile", table: "Profile" },
  { model: "HomePageConfig", delegate: "homePageConfig", table: "HomePageConfig" },
  { model: "HomeSection", delegate: "homeSection", table: "HomeSection" },
  { model: "HomepageImage", delegate: "homepageImage", table: "HomepageImage" },
  { model: "VerificationRequest", delegate: "verificationRequest", table: "VerificationRequest" },
  { model: "MeetCard", delegate: "meetCard", table: "MeetCard" },
  { model: "FriendRequest", delegate: "friendRequest", table: "FriendRequest" },
  { model: "UserBlock", delegate: "userBlock", table: "UserBlock" },
  { model: "Notification", delegate: "notification", table: "Notification" },
  { model: "Conversation", delegate: "conversation", table: "Conversation" },
  { model: "Message", delegate: "message", table: "Message" },
  { model: "ChatMedia", delegate: "chatMedia", table: "ChatMedia" },
  { model: "Favorite", delegate: "favorite", table: "Favorite" },
  { model: "MeetLikeRequest", delegate: "meetLikeRequest", table: "MeetLikeRequest" },
  { model: "MeetMatch", delegate: "meetMatch", table: "MeetMatch" },
  { model: "MeetNotification", delegate: "meetNotification", table: "MeetNotification" },
  { model: "MeetPass", delegate: "meetPass", table: "MeetPass" },
  { model: "MeetBlock", delegate: "meetBlock", table: "MeetBlock" },
];

const CHUNK_SIZE = Number(process.env.MIGRATION_BATCH_SIZE || 500);
const VERIFY_ONLY = process.argv.includes("--verify-only");

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function createClient(url) {
  return new PrismaClient({
    datasources: { db: { url } },
    log: ["error"],
  });
}

async function getTableCount(client, tableName) {
  const rows = await client.$queryRawUnsafe(`SELECT COUNT(*)::bigint AS count FROM "${tableName}"`);
  return Number(rows[0].count);
}

async function logCounts(sourceClient, targetClient, stage) {
  console.log(`\n=== ${stage} row counts ===`);
  for (const table of TABLES) {
    const [sourceCount, targetCount] = await Promise.all([
      getTableCount(sourceClient, table.table),
      getTableCount(targetClient, table.table),
    ]);
    console.log(`${table.table.padEnd(20)} source=${String(sourceCount).padStart(6)} target=${String(targetCount).padStart(6)}`);
  }
}

async function copyTable(sourceClient, targetClient, tableConfig) {
  const sourceDelegate = sourceClient[tableConfig.delegate];
  const targetDelegate = targetClient[tableConfig.delegate];
  let lastId = undefined;
  let copied = 0;

  while (true) {
    const rows = await sourceDelegate.findMany({
      take: CHUNK_SIZE,
      ...(lastId
        ? {
            skip: 1,
            cursor: { id: lastId },
          }
        : {}),
      orderBy: { id: "asc" },
    });

    if (rows.length === 0) {
      break;
    }

    const result = await targetDelegate.createMany({
      data: rows,
      skipDuplicates: true,
    });

    copied += result.count;
    lastId = rows[rows.length - 1].id;
  }

  return copied;
}

async function syncSequences(targetClient) {
  const sequenceColumns = await targetClient.$queryRawUnsafe(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND (
        column_default LIKE 'nextval(%'
        OR is_identity = 'YES'
      )
    ORDER BY table_name, column_name
  `);

  if (sequenceColumns.length === 0) {
    console.log("No serial/identity columns found. Sequence sync skipped.");
    return;
  }

  for (const row of sequenceColumns) {
    const tableName = row.table_name;
    const columnName = row.column_name;
    await targetClient.$executeRawUnsafe(`
      SELECT setval(
        pg_get_serial_sequence('"${tableName}"', '${columnName}'),
        COALESCE((SELECT MAX("${columnName}") FROM "${tableName}"), 0) + 1,
        false
      )
    `);
    console.log(`Synced sequence for ${tableName}.${columnName}`);
  }
}

async function main() {
  const sourceUrl = requireEnv("SOURCE_DATABASE_URL");
  const targetUrl = requireEnv("TARGET_DATABASE_URL");

  const sourceClient = createClient(sourceUrl);
  const targetClient = createClient(targetUrl);

  try {
    await Promise.all([sourceClient.$connect(), targetClient.$connect()]);
    await logCounts(sourceClient, targetClient, "Before copy");

    if (VERIFY_ONLY) {
      console.log("\nVerification only mode complete.");
      return;
    }

    console.log(`\nCopying tables with batch size ${CHUNK_SIZE}...`);

    for (const table of TABLES) {
      const insertedRows = await copyTable(sourceClient, targetClient, table);
      console.log(`${table.table}: inserted ${insertedRows} new row(s)`);
    }

    await syncSequences(targetClient);
    await logCounts(sourceClient, targetClient, "After copy");

    console.log("\nMigration completed successfully.");
  } finally {
    await Promise.allSettled([sourceClient.$disconnect(), targetClient.$disconnect()]);
  }
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});

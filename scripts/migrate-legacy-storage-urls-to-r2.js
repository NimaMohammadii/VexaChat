/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");
const { S3Client, HeadObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_ENDPOINT = process.env.R2_ENDPOINT;

function requireEnv(name, value) {
  if (!value) throw new Error(`Missing required env: ${name}`);
}

function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
}

function isSupabaseStorageUrl(value) {
  return typeof value === "string" && /\/storage\/v1\/object\//.test(value);
}

function parseSupabaseStorageUrl(raw) {
  if (!isSupabaseStorageUrl(raw)) return null;

  try {
    const url = new URL(raw);
    const parts = url.pathname.split("/").filter(Boolean);
    const objectIndex = parts.findIndex((part) => part === "object");
    if (objectIndex < 0 || parts.length < objectIndex + 4) return null;

    const mode = parts[objectIndex + 1];
    const bucket = decodeURIComponent(parts[objectIndex + 2] || "");
    const objectPath = decodeURIComponent(parts.slice(objectIndex + 3).join("/"));

    if (!bucket || !objectPath) return null;
    return { mode, bucket, objectPath };
  } catch {
    return null;
  }
}

function normalizedR2Key({ bucket, objectPath }) {
  return `migrated/${bucket}/${objectPath.replace(/^\/+/, "")}`;
}

async function downloadFromSupabase(parsed) {
  const endpoint = `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/${parsed.mode}/${parsed.bucket}/${encodeURI(parsed.objectPath).replace(/%2F/g, "/")}`;
  const response = await fetch(endpoint, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error(`Supabase download failed: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") || "application/octet-stream";
  const bytes = Buffer.from(await response.arrayBuffer());
  return { bytes, contentType };
}

async function objectExists(r2, key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadIfMissing(r2, key, bytes, contentType) {
  if (await objectExists(r2, key)) return "skipped";

  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: bytes,
    ContentType: contentType || "application/octet-stream"
  }));

  return "uploaded";
}

async function migrateSupabaseUrlValue(r2, value, report, label) {
  if (!isSupabaseStorageUrl(value)) return value;

  const parsed = parseSupabaseStorageUrl(value);
  if (!parsed) {
    report.failures.push(`${label}: unable to parse ${value}`);
    return value;
  }

  const key = normalizedR2Key(parsed);

  try {
    const { bytes, contentType } = await downloadFromSupabase(parsed);
    const state = await uploadIfMissing(r2, key, bytes, contentType);
    if (state === "uploaded") report.uploaded += 1;
    else report.skippedExisting += 1;
    return key;
  } catch (error) {
    report.failures.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
    return value;
  }
}

function scanUrls(values, label, report) {
  for (const value of values) {
    if (isHttpUrl(value)) {
      report.remainingHttpUrls.push({ label, value });
    }
  }
}

async function main() {
  requireEnv("DATABASE_URL", process.env.DATABASE_URL);
  requireEnv("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL);
  requireEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY);
  requireEnv("R2_ACCESS_KEY_ID", R2_ACCESS_KEY_ID);
  requireEnv("R2_SECRET_ACCESS_KEY", R2_SECRET_ACCESS_KEY);
  requireEnv("R2_BUCKET_NAME", R2_BUCKET_NAME);
  requireEnv("R2_ENDPOINT", R2_ENDPOINT);

  const r2 = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY }
  });

  const report = {
    uploaded: 0,
    skippedExisting: 0,
    failures: [],
    remainingHttpUrls: []
  };

  const userProfiles = await prisma.userProfile.findMany({ select: { id: true, avatarUrl: true } });
  for (const row of userProfiles) {
    const migrated = await migrateSupabaseUrlValue(r2, row.avatarUrl, report, `userProfile.avatarUrl:${row.id}`);
    if (migrated !== row.avatarUrl) await prisma.userProfile.update({ where: { id: row.id }, data: { avatarUrl: migrated } });
  }

  const profiles = await prisma.profile.findMany({ select: { id: true, imageUrl: true, images: true } });
  for (const row of profiles) {
    const nextImageUrl = await migrateSupabaseUrlValue(r2, row.imageUrl, report, `profile.imageUrl:${row.id}`);
    const currentImages = Array.isArray(row.images) ? row.images : [];
    const nextImages = [];
    let changed = nextImageUrl !== row.imageUrl;

    for (const item of currentImages) {
      const migrated = await migrateSupabaseUrlValue(r2, item, report, `profile.images:${row.id}`);
      nextImages.push(migrated);
      changed = changed || migrated !== item;
    }

    if (changed) {
      await prisma.profile.update({ where: { id: row.id }, data: { imageUrl: nextImageUrl, images: nextImages } });
    }
  }

  const meetCards = await prisma.meetCard.findMany({ select: { id: true, imageUrl: true } });
  for (const row of meetCards) {
    const migrated = await migrateSupabaseUrlValue(r2, row.imageUrl, report, `meetCard.imageUrl:${row.id}`);
    if (migrated !== row.imageUrl) await prisma.meetCard.update({ where: { id: row.id }, data: { imageUrl: migrated } });
  }

  const verificationRequests = await prisma.verificationRequest.findMany({ select: { id: true, docUrls: true } });
  for (const row of verificationRequests) {
    const urls = Array.isArray(row.docUrls) ? row.docUrls.filter((item) => typeof item === "string") : [];
    let changed = false;
    const nextUrls = [];

    for (const item of urls) {
      const migrated = await migrateSupabaseUrlValue(r2, item, report, `verificationRequest.docUrls:${row.id}`);
      nextUrls.push(migrated);
      changed = changed || migrated !== item;
    }

    if (changed) {
      await prisma.verificationRequest.update({ where: { id: row.id }, data: { docUrls: nextUrls } });
    }
  }

  const sections = await prisma.homeSection.findMany({ select: { id: true, imageUrl: true } });
  for (const row of sections) {
    const migrated = await migrateSupabaseUrlValue(r2, row.imageUrl, report, `homeSection.imageUrl:${row.id}`);
    if (migrated !== row.imageUrl) await prisma.homeSection.update({ where: { id: row.id }, data: { imageUrl: migrated } });
  }

  const homepageImages = await prisma.homepageImage.findMany({ select: { id: true, url: true, storagePath: true } });
  for (const row of homepageImages) {
    let storagePath = row.storagePath;
    let changed = false;

    if (isSupabaseStorageUrl(storagePath)) {
      const migrated = await migrateSupabaseUrlValue(r2, storagePath, report, `homepageImage.storagePath:${row.id}`);
      if (migrated !== storagePath) {
        storagePath = migrated;
        changed = true;
      }
    }

    if (isSupabaseStorageUrl(row.url)) {
      const migrated = await migrateSupabaseUrlValue(r2, row.url, report, `homepageImage.url:${row.id}`);
      if (migrated !== row.url) {
        storagePath = migrated;
        changed = true;
      }
    }

    if (changed) {
      await prisma.homepageImage.update({ where: { id: row.id }, data: { storagePath, url: "" } });
    }
  }

  const chatMediaRows = await prisma.chatMedia.findMany({ select: { id: true, storageKey: true, url: true } });
  for (const row of chatMediaRows) {
    let storageKey = row.storageKey;
    let changed = false;

    if (isSupabaseStorageUrl(storageKey)) {
      const migrated = await migrateSupabaseUrlValue(r2, storageKey, report, `chatMedia.storageKey:${row.id}`);
      if (migrated !== storageKey) {
        storageKey = migrated;
        changed = true;
      }
    }

    if (isSupabaseStorageUrl(row.url)) {
      const migrated = await migrateSupabaseUrlValue(r2, row.url, report, `chatMedia.url:${row.id}`);
      if (migrated !== row.url) {
        storageKey = migrated;
        changed = true;
      }
    }

    if (changed) {
      await prisma.chatMedia.update({ where: { id: row.id }, data: { storageKey, url: storageKey } });
    }
  }

  scanUrls(userProfiles.map((r) => r.avatarUrl), "userProfile.avatarUrl", report);
  scanUrls((await prisma.profile.findMany({ select: { imageUrl: true, images: true } })).flatMap((r) => [r.imageUrl, ...(Array.isArray(r.images) ? r.images : [])]), "profile.imageUrl/images", report);
  scanUrls((await prisma.meetCard.findMany({ select: { imageUrl: true } })).map((r) => r.imageUrl), "meetCard.imageUrl", report);
  scanUrls((await prisma.homeSection.findMany({ select: { imageUrl: true } })).map((r) => r.imageUrl), "homeSection.imageUrl", report);
  scanUrls((await prisma.homepageImage.findMany({ select: { storagePath: true, url: true } })).flatMap((r) => [r.storagePath, r.url]), "homepageImage.storagePath/url", report);
  scanUrls((await prisma.chatMedia.findMany({ select: { storageKey: true, url: true } })).flatMap((r) => [r.storageKey, r.url]), "chatMedia.storageKey/url", report);
  scanUrls((await prisma.verificationRequest.findMany({ select: { docUrls: true } })).flatMap((r) => (Array.isArray(r.docUrls) ? r.docUrls.filter((v) => typeof v === "string") : [])), "verificationRequest.docUrls", report);

  console.log("\nMigration report:\n", JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error("Migration failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

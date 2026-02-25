/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");
const { S3Client, HeadObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_ENDPOINT = process.env.R2_ENDPOINT;

function requireEnv(name, value) {
  if (!value) throw new Error(`Missing required env: ${name}`);
}

function isUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
}

function isSupabaseStorageUrl(value) {
  return typeof value === "string" && value.includes("/storage/v1/object/");
}

function parseSupabaseStorageUrl(raw) {
  if (!isSupabaseStorageUrl(raw)) return null;

  try {
    const url = new URL(raw);
    const parts = url.pathname.split("/").filter(Boolean);
    const objectIndex = parts.findIndex((p) => p === "object");
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
  const cleanObjectPath = objectPath.replace(/^\/+/, "");
  return `migrated/${bucket}/${cleanObjectPath}`;
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
    throw new Error(`Supabase download failed: ${response.status} ${response.statusText} (${endpoint})`);
  }

  const contentType = response.headers.get("content-type") || "application/octet-stream";
  const arrayBuffer = await response.arrayBuffer();
  return { body: Buffer.from(arrayBuffer), contentType };
}

async function r2ObjectExists(r2, key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadToR2IfMissing(r2, key, body, contentType) {
  const exists = await r2ObjectExists(r2, key);
  if (exists) return "skipped";

  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType || "application/octet-stream"
    })
  );

  return "uploaded";
}

async function migrateSupabaseUrlValue(r2, value, report, label) {
  if (!isSupabaseStorageUrl(value)) return value;

  const parsed = parseSupabaseStorageUrl(value);
  if (!parsed) {
    report.failures.push(`${label}: unable to parse ${value}`);
    return value;
  }

  const targetKey = normalizedR2Key(parsed);

  try {
    const { body, contentType } = await downloadFromSupabase(parsed);
    const status = await uploadToR2IfMissing(r2, targetKey, body, contentType);
    if (status === "uploaded") report.uploaded += 1;
    else report.skippedExisting += 1;
    return targetKey;
  } catch (error) {
    report.failures.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
    return value;
  }
}

async function migrateHomepageImageBinary(r2, image, report) {
  if (!image.data) return image;
  if (image.storagePath && !isUrl(image.storagePath)) {
    return image;
  }

  const key = image.storagePath && !isUrl(image.storagePath)
    ? image.storagePath
    : `homepage/images/migrated/${image.id}`;

  const uploadStatus = await uploadToR2IfMissing(r2, key, Buffer.from(image.data), image.contentType || "application/octet-stream");
  if (uploadStatus === "uploaded") report.uploaded += 1;
  else report.skippedExisting += 1;

  await prisma.homepageImage.update({
    where: { id: image.id },
    data: { storagePath: key, url: "", data: null }
  });

  report.updatedHomepageBinaryRows += 1;
}

async function main() {
  requireEnv("DATABASE_URL", process.env.DATABASE_URL);
  requireEnv("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL);
  requireEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY);
  requireEnv("R2_ACCOUNT_ID", R2_ACCOUNT_ID);
  requireEnv("R2_ACCESS_KEY_ID", R2_ACCESS_KEY_ID);
  requireEnv("R2_SECRET_ACCESS_KEY", R2_SECRET_ACCESS_KEY);
  requireEnv("R2_BUCKET_NAME", R2_BUCKET_NAME);
  requireEnv("R2_ENDPOINT", R2_ENDPOINT);

  const r2 = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY
    }
  });

  const report = {
    uploaded: 0,
    skippedExisting: 0,
    failures: [],
    columns: {},
    updatedHomepageBinaryRows: 0
  };

  async function bump(label, key) {
    report.columns[label] = report.columns[label] || { scanned: 0, migrated: 0, skipped: 0, failed: 0 };
    report.columns[label][key] += 1;
  }

  const userProfiles = await prisma.userProfile.findMany({ select: { id: true, avatarUrl: true } });
  for (const row of userProfiles) {
    await bump("userProfile.avatarUrl", "scanned");
    if (!isSupabaseStorageUrl(row.avatarUrl)) {
      await bump("userProfile.avatarUrl", "skipped");
      continue;
    }
    const nextValue = await migrateSupabaseUrlValue(r2, row.avatarUrl, report, `userProfile:${row.id}`);
    if (nextValue !== row.avatarUrl) {
      await prisma.userProfile.update({ where: { id: row.id }, data: { avatarUrl: nextValue } });
      await bump("userProfile.avatarUrl", "migrated");
    } else {
      await bump("userProfile.avatarUrl", "failed");
    }
  }

  const profiles = await prisma.profile.findMany({ select: { id: true, imageUrl: true, images: true } });
  for (const row of profiles) {
    await bump("profile.imageUrl", "scanned");
    let nextImageUrl = row.imageUrl;
    if (isSupabaseStorageUrl(row.imageUrl)) {
      const migrated = await migrateSupabaseUrlValue(r2, row.imageUrl, report, `profile.imageUrl:${row.id}`);
      if (migrated !== row.imageUrl) {
        nextImageUrl = migrated;
        await bump("profile.imageUrl", "migrated");
      } else {
        await bump("profile.imageUrl", "failed");
      }
    } else {
      await bump("profile.imageUrl", "skipped");
    }

    await bump("profile.images[]", "scanned");
    const images = Array.isArray(row.images) ? row.images : [];
    let imagesChanged = false;
    const nextImages = [];
    for (const image of images) {
      if (isSupabaseStorageUrl(image)) {
        const migrated = await migrateSupabaseUrlValue(r2, image, report, `profile.images:${row.id}`);
        nextImages.push(migrated);
        imagesChanged = imagesChanged || migrated !== image;
      } else {
        nextImages.push(image);
      }
    }

    if (imagesChanged || nextImageUrl !== row.imageUrl) {
      await prisma.profile.update({ where: { id: row.id }, data: { imageUrl: nextImageUrl, images: nextImages } });
      await bump("profile.images[]", "migrated");
    } else {
      await bump("profile.images[]", "skipped");
    }
  }

  const meetCards = await prisma.meetCard.findMany({ select: { id: true, imageUrl: true } });
  for (const row of meetCards) {
    await bump("meetCard.imageUrl", "scanned");
    if (!isSupabaseStorageUrl(row.imageUrl)) {
      await bump("meetCard.imageUrl", "skipped");
      continue;
    }

    const migrated = await migrateSupabaseUrlValue(r2, row.imageUrl, report, `meetCard:${row.id}`);
    if (migrated !== row.imageUrl) {
      await prisma.meetCard.update({ where: { id: row.id }, data: { imageUrl: migrated } });
      await bump("meetCard.imageUrl", "migrated");
    } else {
      await bump("meetCard.imageUrl", "failed");
    }
  }

  const verificationRequests = await prisma.verificationRequest.findMany({ select: { id: true, docUrls: true } });
  for (const row of verificationRequests) {
    await bump("verificationRequest.docUrls[]", "scanned");
    const urls = Array.isArray(row.docUrls) ? row.docUrls.filter((item) => typeof item === "string") : [];
    let changed = false;
    const nextUrls = [];
    for (const doc of urls) {
      if (isSupabaseStorageUrl(doc)) {
        const migrated = await migrateSupabaseUrlValue(r2, doc, report, `verificationRequest:${row.id}`);
        nextUrls.push(migrated);
        changed = changed || migrated !== doc;
      } else {
        nextUrls.push(doc);
      }
    }

    if (changed) {
      await prisma.verificationRequest.update({ where: { id: row.id }, data: { docUrls: nextUrls } });
      await bump("verificationRequest.docUrls[]", "migrated");
    } else {
      await bump("verificationRequest.docUrls[]", "skipped");
    }
  }

  const sections = await prisma.homeSection.findMany({ select: { id: true, imageUrl: true } });
  for (const row of sections) {
    await bump("homeSection.imageUrl", "scanned");
    if (!isSupabaseStorageUrl(row.imageUrl)) {
      await bump("homeSection.imageUrl", "skipped");
      continue;
    }

    const migrated = await migrateSupabaseUrlValue(r2, row.imageUrl, report, `homeSection:${row.id}`);
    if (migrated !== row.imageUrl) {
      await prisma.homeSection.update({ where: { id: row.id }, data: { imageUrl: migrated } });
      await bump("homeSection.imageUrl", "migrated");
    } else {
      await bump("homeSection.imageUrl", "failed");
    }
  }

  const homepageImages = await prisma.homepageImage.findMany({ select: { id: true, url: true, storagePath: true, contentType: true, data: true } });
  for (const row of homepageImages) {
    await bump("homepageImage.url", "scanned");

    if (row.data) {
      try {
        await migrateHomepageImageBinary(r2, row, report);
      } catch (error) {
        report.failures.push(`homepageImage.data:${row.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (isSupabaseStorageUrl(row.url)) {
      const migrated = await migrateSupabaseUrlValue(r2, row.url, report, `homepageImage.url:${row.id}`);
      if (migrated !== row.url) {
        await prisma.homepageImage.update({ where: { id: row.id }, data: { storagePath: migrated, url: "", data: null } });
        await bump("homepageImage.url", "migrated");
      } else {
        await bump("homepageImage.url", "failed");
      }
    } else {
      await bump("homepageImage.url", "skipped");
    }
  }

  const chatMediaRows = await prisma.chatMedia.findMany({ select: { id: true, storageKey: true, url: true } });
  for (const row of chatMediaRows) {
    await bump("chatMedia.storageKey/url", "scanned");
    let storageKey = row.storageKey;
    let changed = false;

    if (isSupabaseStorageUrl(row.storageKey)) {
      const migrated = await migrateSupabaseUrlValue(r2, row.storageKey, report, `chatMedia.storageKey:${row.id}`);
      if (migrated !== row.storageKey) {
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
      await bump("chatMedia.storageKey/url", "migrated");
    } else {
      await bump("chatMedia.storageKey/url", "skipped");
    }
  }

  const verificationChecks = {
    userProfileAvatar: await prisma.userProfile.count({ where: { OR: [{ avatarUrl: { contains: "storage/v1/object" } }, { avatarUrl: { contains: "supabase" } }] } }),
    profileImageUrl: await prisma.profile.count({ where: { OR: [{ imageUrl: { contains: "storage/v1/object" } }, { imageUrl: { contains: "supabase" } }] } }),
    meetCardImageUrl: await prisma.meetCard.count({ where: { OR: [{ imageUrl: { contains: "storage/v1/object" } }, { imageUrl: { contains: "supabase" } }] } }),
    homeSectionImageUrl: await prisma.homeSection.count({ where: { OR: [{ imageUrl: { contains: "storage/v1/object" } }, { imageUrl: { contains: "supabase" } }] } }),
    homepageImageUrl: await prisma.homepageImage.count({ where: { OR: [{ url: { contains: "storage/v1/object" } }, { url: { contains: "supabase" } }, { storagePath: { contains: "storage/v1/object" } }, { storagePath: { contains: "supabase" } }] } }),
    chatMediaStorageKey: await prisma.chatMedia.count({ where: { OR: [{ storageKey: { contains: "storage/v1/object" } }, { storageKey: { contains: "supabase" } }, { url: { contains: "storage/v1/object" } }, { url: { contains: "supabase" } }] } })
  };

  console.log("\nMigration report:\n", JSON.stringify({
    uploadedObjects: report.uploaded,
    skippedExistingObjects: report.skippedExisting,
    perColumn: report.columns,
    updatedHomepageBinaryRows: report.updatedHomepageBinaryRows,
    verificationChecks,
    failures: report.failures
  }, null, 2));
}

main()
  .catch((error) => {
    console.error("Migration failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Client, getR2Config } from "@/lib/r2/client";

export function isLegacyUrl(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith("http://") || trimmed.startsWith("https://");
}

export function assertStorageKey(value: string, fieldName = "Storage key") {
  const key = value.trim();

  if (!key) {
    throw new Error(`${fieldName} is required`);
  }

  if (isLegacyUrl(key)) {
    throw new Error(`${fieldName} must be an R2 object key, received URL`);
  }

  return key;
}

export async function getSignedReadUrl(key: string, expiresInSeconds = 60 * 60) {
  const normalizedKey = assertStorageKey(key);
  const { bucketName } = getR2Config();
  return getSignedUrl(getR2Client(), new GetObjectCommand({ Bucket: bucketName, Key: normalizedKey }), { expiresIn: expiresInSeconds });
}

export async function getSignedUploadUrl(key: string, contentType: string, expiresInSeconds = 10 * 60) {
  const normalizedKey = assertStorageKey(key);
  if (!contentType) throw new Error("Content-Type is required");
  const { bucketName } = getR2Config();
  return getSignedUrl(
    getR2Client(),
    new PutObjectCommand({ Bucket: bucketName, Key: normalizedKey, ContentType: contentType }),
    { expiresIn: expiresInSeconds }
  );
}

export async function objectExistsByKey(key: string) {
  const normalizedKey = assertStorageKey(key);
  const { bucketName } = getR2Config();

  try {
    await getR2Client().send(new HeadObjectCommand({ Bucket: bucketName, Key: normalizedKey }));
    return true;
  } catch {
    return false;
  }
}

export async function deleteObjectByKey(key: string) {
  const normalizedKey = assertStorageKey(key);
  const { bucketName } = getR2Config();
  await getR2Client().send(new DeleteObjectCommand({ Bucket: bucketName, Key: normalizedKey }));
}

export async function resolveStoredFileUrl(value: string) {
  if (!value) return "";
  return getSignedReadUrl(assertStorageKey(value));
}

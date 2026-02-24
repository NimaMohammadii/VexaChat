import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Client, getR2Config } from "@/lib/r2/client";

export function isLegacyUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

export async function getSignedReadUrl(key: string, expiresInSeconds = 60 * 60) {
  if (!key) throw new Error("Storage key is required");
  const { bucketName } = getR2Config();
  return getSignedUrl(getR2Client(), new GetObjectCommand({ Bucket: bucketName, Key: key }), { expiresIn: expiresInSeconds });
}

export async function getSignedUploadUrl(key: string, contentType: string, expiresInSeconds = 10 * 60) {
  if (!key) throw new Error("Storage key is required");
  if (!contentType) throw new Error("Content-Type is required");
  const { bucketName } = getR2Config();
  return getSignedUrl(
    getR2Client(),
    new PutObjectCommand({ Bucket: bucketName, Key: key, ContentType: contentType }),
    { expiresIn: expiresInSeconds }
  );
}

export async function deleteObjectByKey(key: string) {
  if (!key || isLegacyUrl(key)) return;
  const { bucketName } = getR2Config();
  await getR2Client().send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
}

export async function resolveStoredFileUrl(value: string) {
  if (!value) return "";
  if (isLegacyUrl(value)) return value;
  return getSignedReadUrl(value);
}

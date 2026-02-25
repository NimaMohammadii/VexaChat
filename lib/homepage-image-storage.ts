import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, getR2Config } from "@/lib/r2/client";

const HOMEPAGE_STORAGE_PREFIX = "homepage/images";

function normalizeImageMimeType(type: string) {
  if (type === "image/png") return "image/png";
  if (type === "image/webp") return "image/webp";
  if (type === "image/gif") return "image/gif";
  if (type === "image/avif") return "image/avif";
  return "image/jpeg";
}

function extensionFromMimeType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  if (type === "image/avif") return "avif";
  return "jpg";
}

export async function uploadHomepageImage(file: File) {
  const contentType = normalizeImageMimeType(file.type);
  const extension = extensionFromMimeType(contentType);
  const key = `${HOMEPAGE_STORAGE_PREFIX}/${Date.now()}-${randomUUID()}.${extension}`;
  const body = Buffer.from(await file.arrayBuffer());
  const { bucketName } = getR2Config();

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType
    })
  );

  return {
    contentType,
    storagePath: key
  };
}

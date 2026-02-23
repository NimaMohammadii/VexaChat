const DATABASE_STORAGE_PREFIX = "db:";

function normalizeImageMimeType(type: string) {
  if (type === "image/png") return "image/png";
  if (type === "image/webp") return "image/webp";
  if (type === "image/gif") return "image/gif";
  if (type === "image/avif") return "image/avif";
  return "image/jpeg";
}

export async function prepareHomepageImageUpload(file: File) {
  const contentType = normalizeImageMimeType(file.type);
  const data = Buffer.from(await file.arrayBuffer());

  return {
    contentType,
    data,
    storagePath: `${DATABASE_STORAGE_PREFIX}${Date.now()}`
  };
}

export function buildHomepageImageUrl(imageId: string) {
  return `/api/homepage-images/${imageId}`;
}


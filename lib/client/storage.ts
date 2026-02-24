export async function presignUpload(key: string, contentType: string) {
  const response = await fetch("/api/storage/presign-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, contentType })
  });
  const payload = (await response.json()) as { error?: string; uploadUrl?: string; key?: string };
  if (!response.ok || !payload.uploadUrl || !payload.key) {
    throw new Error(payload.error ?? "Unable to create upload URL.");
  }
  return payload;
}

export async function uploadFileWithPresignedUrl(uploadUrl: string, file: File) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file
  });
  if (!response.ok) {
    throw new Error("Upload failed.");
  }
}

export async function presignRead(key: string) {
  if (!key) return "";
  if (key.startsWith("http://") || key.startsWith("https://")) return key;

  const response = await fetch("/api/storage/presign-read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key })
  });
  const payload = (await response.json()) as { error?: string; url?: string };
  if (!response.ok || !payload.url) {
    throw new Error(payload.error ?? "Unable to create read URL.");
  }
  return payload.url;
}

export async function deleteStoredObject(key: string) {
  if (!key || key.startsWith("http://") || key.startsWith("https://")) return;
  await fetch("/api/storage/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key })
  });
}

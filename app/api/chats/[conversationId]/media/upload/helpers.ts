const CUID_REGEX = /^c[a-z0-9]{24}$/i;

export function validateConversationId(conversationId: unknown): conversationId is string {
  if (typeof conversationId !== "string") return false;
  const normalizedId = conversationId.trim();
  if (!normalizedId) return false;
  return CUID_REGEX.test(normalizedId);
}

export function resolveContentType(mediaType: "image" | "video", mime: string) {
  if (mime) return mime;
  return mediaType === "image" ? "image/jpeg" : "video/mp4";
}

export function extensionFromMime(mime: string, mediaType: "image" | "video") {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "video/mp4") return "mp4";
  if (mime === "video/webm") return "webm";
  if (mime === "video/quicktime") return "mov";
  if (!mime) return mediaType === "image" ? "jpg" : "mp4";
  return "bin";
}

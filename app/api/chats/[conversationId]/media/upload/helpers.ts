const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateConversationId(conversationId: unknown): conversationId is string {
  return typeof conversationId === "string" && UUID_REGEX.test(conversationId);
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

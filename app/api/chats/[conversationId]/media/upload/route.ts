import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";
import { uploadChatMedia } from "@/lib/storage";

const VIDEO_MAX_SIZE_BYTES = 8 * 1024 * 1024;
const IMAGE_TTL_HOURS = 6;
const VIDEO_TTL_HOURS = 2;

function extensionFromMime(mime: string) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "video/mp4") return "mp4";
  if (mime === "video/webm") return "webm";
  if (mime === "video/quicktime") return "mov";
  return "bin";
}

export async function POST(request: Request, { params }: { params: { conversationId: string } }) {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversation = await prisma.conversation.findUnique({ where: { id: params.conversationId } });
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (conversation.userAId !== user.id && conversation.userBId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (conversation.expiresAt <= new Date()) {
    return NextResponse.json({ error: "Chat expired" }, { status: 410 });
  }

  const formData = await request.formData();
  const mediaType = formData.get("type");
  const file = formData.get("file");

  if ((mediaType !== "image" && mediaType !== "video") || !(file instanceof File)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (mediaType === "image" && !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Invalid image file" }, { status: 400 });
  }

  if (mediaType === "video" && !file.type.startsWith("video/")) {
    return NextResponse.json({ error: "Invalid video file" }, { status: 400 });
  }

  if (mediaType === "video" && file.size > VIDEO_MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Video must be 8MB or smaller" }, { status: 400 });
  }

  const mediaId = crypto.randomUUID();
  const extension = extensionFromMime(file.type);
  const storageKey = `${params.conversationId}/${mediaId}.${extension}`;

  const { publicUrl } = await uploadChatMedia({
    file,
    key: storageKey,
    contentType: file.type || (mediaType === "image" ? "image/jpeg" : "video/mp4")
  });

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + (mediaType === "image" ? IMAGE_TTL_HOURS : VIDEO_TTL_HOURS) * 60 * 60 * 1000
  );

  const [, message, media] = await prisma.$transaction([
    prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: now } }),
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        type: mediaType,
        text: null
      }
    }),
    prisma.chatMedia.create({
      data: {
        id: mediaId,
        conversationId: conversation.id,
        senderId: user.id,
        type: mediaType,
        storageKey,
        url: storageKey,
        expiresAt,
        fileSize: file.size,
        mimeType: file.type || null
      }
    })
  ]);

  const linked = await prisma.chatMedia.update({ where: { id: media.id }, data: { messageId: message.id } });

  return NextResponse.json({
    media: {
      id: linked.id,
      messageId: message.id,
      type: linked.type,
      url: publicUrl,
      expiresAt: linked.expiresAt
    }
  });
}

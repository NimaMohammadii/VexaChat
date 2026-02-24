import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";
import { uploadChatMedia } from "@/lib/storage";
import { extensionFromMime, resolveContentType, validateConversationId } from "./helpers";

const VIDEO_MAX_SIZE_BYTES = 8 * 1024 * 1024;
const IMAGE_TTL_HOURS = 6;
const VIDEO_TTL_HOURS = 2;

export async function POST(
  request: Request,
  { params }: { params?: { conversationId?: string | null } | null }
) {
  const conversationId = typeof params?.conversationId === "string" ? params.conversationId.trim() : "";
  let mediaType: FormDataEntryValue | null = null;
  let file: FormDataEntryValue | null = null;

  try {
    if (!validateConversationId(conversationId)) {
      if (process.env.NODE_ENV === "development") {
        console.error("Invalid upload conversation id", {
          conversationId: params?.conversationId ?? null,
          mediaType: null,
          fileType: null,
          fileSize: null
        });
      }
      return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
    }

    const user = await getAuthenticatedUser({ canSetCookies: true });
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
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
    mediaType = formData.get("type");
    file = formData.get("file");

    if ((mediaType !== "image" && mediaType !== "video") || !(file instanceof File)) {
      if (process.env.NODE_ENV === "development") {
        console.error("Invalid upload payload", {
          conversationId,
          mediaType,
          fileType: file instanceof File ? file.type : null,
          fileSize: file instanceof File ? file.size : null
        });
      }
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const contentType = resolveContentType(mediaType, file.type);

    if (mediaType === "image" && !contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid image file" }, { status: 400 });
    }

    if (mediaType === "video" && !contentType.startsWith("video/")) {
      return NextResponse.json({ error: "Invalid video file" }, { status: 400 });
    }

    if (mediaType === "video" && file.size > VIDEO_MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Video must be 8MB or smaller" }, { status: 400 });
    }

    const mediaId = crypto.randomUUID();
    const extension = extensionFromMime(file.type, mediaType);
    const storageKey = `${conversationId}/${mediaId}.${extension}`;

    const { publicUrl } = await uploadChatMedia({
      file,
      key: storageKey,
      contentType
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
          mimeType: contentType
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Upload failed (server error).";
    console.error("Upload media failed", {
      conversationId,
      mediaType,
      fileType: file instanceof File ? file.type : null,
      fileSize: file instanceof File ? file.size : null,
      error: errorMessage
    });

    if (errorMessage.includes("Missing SUPABASE_URL") || errorMessage.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return NextResponse.json({ error: "Server storage is not configured." }, { status: 500 });
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

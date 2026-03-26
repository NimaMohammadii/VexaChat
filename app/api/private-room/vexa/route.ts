import { NextRequest, NextResponse } from "next/server";
import { generateVexaResponse } from "@/lib/ai/vexa";
import { canAccessPrivateRoom } from "@/lib/private-room/access";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser({ canSetCookies: true });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json().catch(() => ({}))) as {
      roomId?: string;
      prompt?: string;
    };

    const roomId = payload.roomId?.trim();
    const prompt = payload.prompt?.trim();

    if (!roomId || !prompt) {
      return NextResponse.json({ error: "roomId and prompt are required" }, { status: 400 });
    }

    const access = await canAccessPrivateRoom(roomId, user.id);

    if (!access.canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const response = await generateVexaResponse(prompt);

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Failed to generate Vexa response", error);
    return NextResponse.json({ error: "Unable to get Vexa response" }, { status: 500 });
  }
}

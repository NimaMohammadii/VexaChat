import { RtcRole, RtcTokenBuilder } from "agora-access-token";
import { NextRequest, NextResponse } from "next/server";

const TOKEN_EXPIRY_SECONDS = 60 * 60;

export async function GET(request: NextRequest) {
  const channel = request.nextUrl.searchParams.get("channel");
  const uidParam = request.nextUrl.searchParams.get("uid");
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!channel || !uidParam) {
    return NextResponse.json({ error: "Missing channel or uid" }, { status: 400 });
  }

  if (!appId || !appCertificate) {
    return NextResponse.json({ error: "Agora credentials are not configured" }, { status: 500 });
  }

  const uid = Number(uidParam);

  if (!Number.isInteger(uid) || uid <= 0) {
    return NextResponse.json({ error: "Invalid uid" }, { status: 400 });
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = nowInSeconds + TOKEN_EXPIRY_SECONDS;

  const token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channel, uid, RtcRole.PUBLISHER, privilegeExpiredTs);

  return NextResponse.json({ token });
}

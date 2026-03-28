import { NextResponse } from "next/server";
import { ensureMenuAccessConfig } from "@/lib/menu-access";

export async function GET() {
  try {
    const config = await ensureMenuAccessConfig();
    return NextResponse.json(
      { lockedKeys: config.lockedKeys },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" } }
    );
  } catch (error) {
    console.error("[menu-access][GET]", error);
    return NextResponse.json(
      { lockedKeys: [] },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" } }
    );
  }
}

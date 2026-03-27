import { NextResponse } from "next/server";
import { ensureMenuAccessConfig } from "@/lib/menu-access";

export async function GET() {
  try {
    const config = await ensureMenuAccessConfig();
    return NextResponse.json({ lockedKeys: config.lockedKeys });
  } catch (error) {
    console.error("[menu-access][GET]", error);
    return NextResponse.json({ lockedKeys: [] });
  }
}

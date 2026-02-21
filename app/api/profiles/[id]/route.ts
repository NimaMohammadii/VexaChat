import { NextResponse } from "next/server";
import { getProfile, removeProfile, upsertProfile } from "@/lib/profile-store";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const profile = getProfile(params.id);
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(profile);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  return NextResponse.json(upsertProfile({ id: params.id, name: body.name ?? "Unnamed", bio: body.bio }));
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  removeProfile(params.id);
  return NextResponse.json({ ok: true });
}

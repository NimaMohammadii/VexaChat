import { NextRequest, NextResponse } from "next/server";
import { deleteProfile, getProfile, updateProfile } from "@/lib/profile-store";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const updated = updateProfile(params.id, body);

  if (!updated) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const deleted = deleteProfile(params.id);

  if (!deleted) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const formData = await request.formData();
  if (formData.get("_method") === "DELETE") {
    deleteProfile(params.id);
  }

  return NextResponse.redirect(new URL("/admin/profiles", request.url));
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const profile = getProfile(params.id);

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(profile);
}

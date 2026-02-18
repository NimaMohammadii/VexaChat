import { prisma } from "@/lib/prisma";
import { saveKycFile } from "@/lib/kyc-storage";
import { NextResponse } from "next/server";
import { getOrCreateCurrentUserRecord } from "@/lib/current-user";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  const user = await getOrCreateCurrentUserRecord();

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const displayName = formData.get("displayName")?.toString().trim() ?? "";
  const bio = formData.get("bio")?.toString().trim() ?? "";
  const priceValue = formData.get("price")?.toString() ?? "";
  const city = formData.get("city")?.toString().trim() ?? "";
  const profileImage = formData.get("profileImage");
  const idCardImage = formData.get("idCardImage");
  const selfieWithIdImage = formData.get("selfieWithIdImage");

  if (!displayName || !bio || !priceValue || !city) {
    return badRequest("All fields are required.");
  }

  const price = Number.parseInt(priceValue, 10);
  if (!Number.isFinite(price) || price <= 0) {
    return badRequest("Monthly price must be a positive number.");
  }

  if (!(profileImage instanceof File) || !(idCardImage instanceof File) || !(selfieWithIdImage instanceof File)) {
    return badRequest("All required images must be uploaded.");
  }

  try {
    const [profileImagePath, idCardPath, selfiePath] = await Promise.all([
      saveKycFile(profileImage, user.id, "profile"),
      saveKycFile(idCardImage, user.id, "id-card"),
      saveKycFile(selfieWithIdImage, user.id, "selfie-with-id")
    ]);

    await prisma.$transaction([
      prisma.creatorProfile.upsert({
        where: { userId: user.id },
        update: {
          displayName,
          bio,
          price,
          city,
          profileImageUrl: profileImagePath,
          idCardUrl: idCardPath,
          selfieWithIdUrl: selfiePath,
          approved: false
        },
        create: {
          userId: user.id,
          displayName,
          bio,
          price,
          city,
          profileImageUrl: profileImagePath,
          idCardUrl: idCardPath,
          selfieWithIdUrl: selfiePath,
          approved: false
        }
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { kycStatus: "PENDING", role: "USER" }
      })
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not submit application.";
    return badRequest(message);
  }
}

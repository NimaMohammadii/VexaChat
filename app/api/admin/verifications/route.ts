import { NextResponse } from "next/server";
import { isAdminAccessAllowed } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

const statusRank = {
  pending: 0,
  approved: 1,
  rejected: 2
};

export async function GET() {
  const hasAdminAccess = await isAdminAccessAllowed();

  if (!hasAdminAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const requests = await prisma.verificationRequest.findMany({
    orderBy: { createdAt: "desc" }
  });

  const userIds = [...new Set(requests.map((item) => item.userId))];
  const userProfiles = userIds.length
    ? await prisma.userProfile.findMany({
      where: { userId: { in: userIds } },
      select: {
        userId: true,
        name: true,
        username: true
      }
    })
    : [];

  const profileByUserId = new Map(userProfiles.map((profile) => [profile.userId, profile]));

  const verifications = requests
    .map((item) => ({
      ...item,
      docUrls: Array.isArray(item.docUrls) ? item.docUrls.filter((doc): doc is string => typeof doc === "string") : [],
      userProfile: profileByUserId.get(item.userId) ?? null
    }))
    .sort((a, b) => {
      const statusDiff = statusRank[a.status] - statusRank[b.status];
      if (statusDiff !== 0) {
        return statusDiff;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return NextResponse.json({ verifications });
}

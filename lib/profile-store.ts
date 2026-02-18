import { prisma } from "@/lib/prisma";

export async function getProfiles() {
  return prisma.profile.findMany({ orderBy: { createdAt: "desc" } });
}

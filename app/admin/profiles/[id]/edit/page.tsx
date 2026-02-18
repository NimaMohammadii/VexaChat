import { notFound } from "next/navigation";
import { EditProfileForm } from "@/components/edit-profile-form";
import { prisma } from "@/lib/prisma";

export default async function EditProfilePage({ params }: { params: { id: string } }) {
  const profile = await prisma.profile.findUnique({ where: { id: params.id } });

  if (!profile) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Edit {profile.name}</h1>
      <EditProfileForm profile={profile} />
    </div>
  );
}

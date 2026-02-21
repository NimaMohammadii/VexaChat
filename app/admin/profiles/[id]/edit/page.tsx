import { notFound } from "next/navigation";
import { EditProfileForm } from "@/components/edit-profile-form";
import { getProfileById } from "@/lib/profiles";
export const dynamic = "force-dynamic";
export const revalidate = 0;


export default async function EditProfilePage({ params }: { params: { id: string } }) {
  const profile = await getProfileById(params.id, true);

  if (!profile) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Edit Profile</h1>
      <div className="bw-card p-6">
        <EditProfileForm profile={profile} isAdminContext />
      </div>
    </section>
  );
}
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

async function createProfile(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const age = Number(formData.get("age"));
  const city = String(formData.get("city") ?? "").trim();
  const price = Number(formData.get("price"));
  const description = String(formData.get("description") ?? "").trim();

  await prisma.profile.create({
    data: {
      name,
      age,
      city,
      price,
      description,
      images: []
    }
  });

  revalidatePath("/");
  revalidatePath("/admin/profiles");

  redirect("/admin/profiles");
}

export default function NewProfilePage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">New Profile</h1>
      <div className="bw-card p-6">
        <form action={createProfile} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span>Name</span>
              <input className="bw-input" name="name" required />
            </label>
            <label className="space-y-2 text-sm">
              <span>Age</span>
              <input className="bw-input" type="number" name="age" min={18} required />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span>City</span>
              <input className="bw-input" name="city" required />
            </label>
            <label className="space-y-2 text-sm">
              <span>Price (hourly)</span>
              <input className="bw-input" type="number" name="price" min={0} required />
            </label>
          </div>

          <label className="space-y-2 text-sm">
            <span>Description</span>
            <textarea className="bw-input min-h-32" name="description" required />
          </label>

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="bw-button">
              Create
            </button>
            <Link href="/admin/profiles" className="bw-button-muted">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}

import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createUniqueProfileSlug } from "@/lib/profile-slug";

function splitCommaSeparated(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function createProfile(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const age = Number(formData.get("age"));
  const city = String(formData.get("city") ?? "").trim();
  const price = Number(formData.get("price"));
  const description = String(formData.get("description") ?? "").trim();
  const height = String(formData.get("height") ?? "").trim();
  const availability = String(formData.get("availability") ?? "Unavailable").trim();
  const experienceYears = Number(formData.get("experienceYears") ?? 0);
  const rating = Number(formData.get("rating") ?? 0);
  const verified = formData.get("verified") === "on";
  const isTop = formData.get("isTop") === "on";
  const languages = splitCommaSeparated(String(formData.get("languages") ?? ""));
  const services = splitCommaSeparated(String(formData.get("services") ?? ""));
  const slugInput = String(formData.get("slug") ?? "").trim();
  const slug = await createUniqueProfileSlug(slugInput || name, async (candidate) => {
    const existing = await prisma.profile.findUnique({
      where: { slug: candidate },
      select: { id: true }
    });

    return Boolean(existing);
  });

  await prisma.profile.create({
    data: {
      slug,
      name,
      age,
      city,
      price,
      description,
      images: [],
      height,
      availability,
      experienceYears,
      rating,
      verified,
      isTop,
      languages,
      services
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
              <span>Slug (optional)</span>
              <input className="bw-input" name="slug" placeholder="e.g. jane-doe" />
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

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span>Height</span>
              <input className="bw-input" name="height" placeholder="e.g. 175 cm" />
            </label>
            <label className="space-y-2 text-sm">
              <span>Availability</span>
              <input className="bw-input" name="availability" defaultValue="Available" />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span>Experience (years)</span>
              <input className="bw-input" type="number" name="experienceYears" min={0} defaultValue={0} />
            </label>
            <label className="space-y-2 text-sm">
              <span>Rating</span>
              <input className="bw-input" type="number" name="rating" min={0} max={5} step={0.1} defaultValue={0} />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" name="verified" className="h-4 w-4 accent-white" />
              <span>Verified profile</span>
            </label>

            <label className="flex items-center justify-between rounded-xl border border-line bg-black/30 px-4 py-3 text-sm">
              <span>Top Profile</span>
              <span className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" name="isTop" className="peer sr-only" />
                <span className="h-6 w-11 rounded-full border border-white/20 bg-white/10 transition peer-checked:border-violet-300/70 peer-checked:bg-violet-500/25" />
                <span className="pointer-events-none absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-[0_0_10px_rgba(168,85,247,0.35)] transition-transform peer-checked:translate-x-5" />
              </span>
            </label>
          </div>

          <label className="space-y-2 text-sm">
            <span>Languages (comma separated)</span>
            <input className="bw-input" name="languages" placeholder="English, Spanish" />
          </label>

          <label className="space-y-2 text-sm">
            <span>Services (comma separated)</span>
            <input className="bw-input" name="services" placeholder="Dinner Date, Event Companion" />
          </label>

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

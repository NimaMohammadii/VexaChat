import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

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
  const languages = splitCommaSeparated(String(formData.get("languages") ?? ""));
  const services = splitCommaSeparated(String(formData.get("services") ?? ""));

  await prisma.profile.create({
    data: {
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

          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="verified" className="h-4 w-4 accent-white" />
            <span>Verified profile</span>
          </label>

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

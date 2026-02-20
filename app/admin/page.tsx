import { listProfiles } from "@/lib/profiles";

export default async function AdminDashboardPage() {
  const profiles = await listProfiles();

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <div className="bw-card p-6">
        <p className="text-sm text-white/70">Total Profiles</p>
        <p className="mt-2 text-5xl font-semibold">{profiles.length}</p>
      </div>
    </section>
  );
}

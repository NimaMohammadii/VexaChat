import { HomeDashboard } from "@/components/home/home-dashboard";
import { getHomeDashboardData } from "@/lib/home/dashboard";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getAuthenticatedUser({ canSetCookies: false });
  const data = await getHomeDashboardData(user);

  return <HomeDashboard data={data} />;
}

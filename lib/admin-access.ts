import { cookies } from "next/headers";
import { isAdminUser } from "@/lib/admin";
import { ADMIN_COOKIE, isAdminTokenValid } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function isAdminAccessAllowed() {
  const user = await getAuthenticatedUser();

  if (user && isAdminUser(user)) {
    return true;
  }

  const adminCookie = cookies().get(ADMIN_COOKIE)?.value;
  return isAdminTokenValid(adminCookie);
}

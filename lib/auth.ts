import { cookies } from "next/headers";

export const ADMIN_COOKIE = "vexa_admin";

export function isAdminLoggedIn() {
  return cookies().get(ADMIN_COOKIE)?.value === "1";
}

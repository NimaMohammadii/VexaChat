import { User } from "@supabase/supabase-js";

function normalizeList(value: string | undefined) {
  if (!value) {
    return [] as string[];
  }

  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminUser(user: User | null) {
  if (!user) {
    return false;
  }

  const adminEmails = normalizeList(process.env.ADMIN_EMAILS);
  const adminUserIds = normalizeList(process.env.ADMIN_USER_IDS);
  const email = (user.email ?? "").toLowerCase();

  return adminUserIds.includes(user.id.toLowerCase()) || (email ? adminEmails.includes(email) : false);
}

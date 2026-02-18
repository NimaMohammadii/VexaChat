export const ADMIN_COOKIE = "admin_auth";

export function getAdminToken(secret: string) {
  return secret.split("").reverse().join("") + "::admin";
}

export function isAdminTokenValid(cookieValue?: string | null) {
  const secret = process.env.SECRET_KEY;
  if (!secret || !cookieValue) {
    return false;
  }

  return cookieValue === getAdminToken(secret);
}

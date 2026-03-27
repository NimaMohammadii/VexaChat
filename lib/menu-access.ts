import { prisma } from "@/lib/prisma";

export const MENU_ITEM_KEYS = ["home", "meet", "private-room", "friends", "noir", "me"] as const;

export type MenuItemKey = (typeof MENU_ITEM_KEYS)[number];

export const MENU_ITEM_KEY_SET = new Set<string>(MENU_ITEM_KEYS);

function normalizeLockedKeys(keys: string[]) {
  return Array.from(new Set(keys.filter((key) => MENU_ITEM_KEY_SET.has(key))));
}

export async function ensureMenuAccessConfig() {
  const existing = await prisma.menuAccessConfig.findFirst({ orderBy: { updatedAt: "desc" } });

  if (existing) {
    return {
      ...existing,
      lockedKeys: normalizeLockedKeys(existing.lockedKeys)
    };
  }

  return prisma.menuAccessConfig.create({
    data: {
      lockedKeys: []
    }
  });
}

export function normalizeMenuLockKeys(input: unknown) {
  if (!Array.isArray(input)) {
    return null;
  }

  const candidate = input.filter((value): value is string => typeof value === "string");
  return normalizeLockedKeys(candidate);
}

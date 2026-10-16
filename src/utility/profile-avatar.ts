import type { IUser } from "./interface";

/** `picture` may be a storage filename; only resolved URLs belong in image src. */
export function getProfileAvatarUrl(user: Partial<Pick<IUser, "picture_url" | "picture">> | null | undefined): string | undefined {
  const resolved = user?.picture_url?.trim();
  if (resolved && resolved !== "null" && resolved !== "undefined") return resolved;
  const legacy = user?.picture?.trim();
  return legacy && /^https?:\/\//i.test(legacy) ? legacy : undefined;
}

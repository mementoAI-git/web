export interface AvatarIdentity {
  userId?: string | null;
  email?: string | null;
  name?: string | null;
}

/** Account IDs keep avatars stable across renames and email changes.
 * Pending invitations use email until linked; names are a last resort for legacy data.
 * Keep this contract in sync with mobile's features/account/avatar-source.ts.
 */
export function getAvatarSeed({ userId, email, name }: AvatarIdentity): string {
  return (
    [userId, email, name]
      .map((value) => value?.trim().toLowerCase())
      .find(Boolean) ?? ""
  );
}

export function getGeneratedAvatarUrl(
  identity: AvatarIdentity,
): string | undefined {
  const seed = getAvatarSeed(identity);
  return seed
    ? `https://api.dicebear.com/10.x/loops/svg?seed=${encodeURIComponent(seed)}`
    : undefined;
}

/** Replace stored DiceBear placeholders while retaining genuine profile photos. */
export function getAvatarSourceUrl(src: string | null | undefined, identity: AvatarIdentity): string | undefined {
  if (!src?.trim()) return undefined;
  try {
    const url = new URL(src);
    if (url.hostname === "api.dicebear.com") {
      return getGeneratedAvatarUrl(identity) ?? getGeneratedAvatarUrl({ name: url.searchParams.get("seed") });
    }
  } catch {
    // Relative and blob URLs can be uploaded photo previews.
  }
  return src;
}

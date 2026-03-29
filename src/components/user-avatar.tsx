import { Avatar } from "@heroui/react";
import { cn, isEmpty } from "@/utility";

const AVATAR_COLORS = ["default", "accent", "success", "warning", "danger"] as const;

export type UserAvatarColor = (typeof AVATAR_COLORS)[number];

/** Stable HeroUI avatar color from any string (e.g. email). */
export function avatarColorFromSeed(seed: string): UserAvatarColor {
  if (!seed) return "default";
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export type UserAvatarProps = {
  alt: string;
  className?: string;
  /** Used with `email` to pick a stable gradient color when there is no photo. */
  name?: string;
  email?: string;
  colorSeed?: string;
  size?: "sm" | "md" | "lg";
  src?: string | null;
};

/**
 * HeroUI Avatar with `variant="soft"` and gradient fallbacks (no initials).
 * When `src` is set and loads, the image is shown; otherwise a colored gradient disk.
 */
export function UserAvatar({
  alt,
  className,
  colorSeed,
  email,
  name,
  size = "md",
  src,
}: UserAvatarProps) {
  const seed = colorSeed ?? `${email ?? ""}|${name ?? ""}`;
  const color = avatarColorFromSeed(seed);
  const showImage = !isEmpty(src);

  return (
    <Avatar
      color={color}
      size={size}
      variant="soft"
      {...(showImage ? {} : { "aria-label": alt })}
      className={cn("user-avatar shrink-0", className)}
    >
      {showImage ? <Avatar.Image src={src!} alt={alt} /> : null}
      <Avatar.Fallback />
    </Avatar>
  );
}

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn, isEmpty } from "@/utility";

const AVATAR_BG_COLORS = [
  "bg-muted",
  "bg-blue-100",
  "bg-green-100",
  "bg-amber-100",
  "bg-red-100",
] as const;

export type UserAvatarColor = (typeof AVATAR_BG_COLORS)[number];

/** Stable avatar fallback color from any string (e.g. email). */
// eslint-disable-next-line react-refresh/only-export-components
export function avatarColorFromSeed(seed: string): UserAvatarColor {
  if (!seed) return AVATAR_BG_COLORS[0];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) >>> 0;
  return AVATAR_BG_COLORS[h % AVATAR_BG_COLORS.length];
}

export type UserAvatarProps = {
  alt: string;
  className?: string;
  /** Used with `email` to pick a stable gradient color when there is no photo. */
  name?: string;
  email?: string;
  colorSeed?: string;
  /** Maps to shadcn `Avatar` sizes: sm → `sm`, md → `default`, lg → `lg`. */
  size?: "sm" | "md" | "lg";
  src?: string | null;
};

const userSizeToAvatarSize = {
  sm: "sm",
  md: "default",
  lg: "lg",
} as const satisfies Record<NonNullable<UserAvatarProps["size"]>, "sm" | "default" | "lg">;

/**
 * Avatar with gradient fallbacks (no initials).
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
  const colorBg = avatarColorFromSeed(seed);
  const showImage = !isEmpty(src);

  return (
    <Avatar
      size={userSizeToAvatarSize[size]}
      className={cn("user-avatar shrink-0", className)}
      {...(showImage ? {} : { "aria-label": alt })}
    >
      {showImage ? <AvatarImage src={src!} alt={alt} /> : null}
      <AvatarFallback className={colorBg} />
    </Avatar>
  );
}

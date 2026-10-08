import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn, isEmpty } from "@/utility";

export type UserAvatarProps = {
  alt: string;
  className?: string;
  /** Name fallback when no email or user ID is available. */
  name?: string;
  email?: string;
  /** Optional explicit seed, retained for existing consumers. */
  colorSeed?: string;
  userId?: string;
  /** Maps to shadcn `Avatar` sizes: sm → `sm`, md → `default`, lg → `lg`. */
  size?: "sm" | "md" | "lg";
  src?: string | null;
};

const userSizeToAvatarSize = {
  sm: "sm",
  md: "default",
  lg: "lg",
} as const satisfies Record<NonNullable<UserAvatarProps["size"]>, "sm" | "default" | "lg">;

/** Uploaded photo or the same deterministic Critters avatar used on mobile. */
export function UserAvatar({
  alt,
  className,
  colorSeed,
  email,
  name,
  size = "md",
  src,
  userId,
}: UserAvatarProps) {
  const seed = (colorSeed || email || userId || name || "").trim().toLowerCase();
  const [failedImage, setFailedImage] = useState<string>();
  const photoSrc = !isEmpty(src) ? src! : undefined;
  const generatedSrc = seed
    ? `https://api.dicebear.com/10.x/critters/png?seed=${encodeURIComponent(seed)}`
    : undefined;
  const candidateSrc = photoSrc || generatedSrc;
  const imageSrc = candidateSrc !== failedImage ? candidateSrc : undefined;
  const initials = name?.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "";

  return (
    <Avatar
      size={userSizeToAvatarSize[size]}
      className={cn("user-avatar shrink-0", className)}
      aria-label={alt || undefined}
    >
      {imageSrc ? (
        <AvatarImage
          key={imageSrc}
          src={imageSrc}
          alt={alt}
          onLoadingStatusChange={(status) => {
            if (status === "error") setFailedImage(imageSrc);
          }}
        />
      ) : null}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}

import { getAvatarSourceUrl, getGeneratedAvatarUrl } from "@/utility/avatar-identity";
import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/utility";

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
} as const satisfies Record<
  NonNullable<UserAvatarProps["size"]>,
  "sm" | "default" | "lg"
>;

/** Uploaded photo or a deterministic DiceBear Loops avatar. */
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
  const [failedImages, setFailedImages] = useState<Set<string>>(
    () => new Set(),
  );
  const photoSrc = getAvatarSourceUrl(src, { userId, email: email || colorSeed, name });
  const generatedSrc = getGeneratedAvatarUrl({
    userId,
    email: email || colorSeed,
    name,
  });
  const imageSrc = [photoSrc, generatedSrc].find(
    (source) => source && !failedImages.has(source),
  );
  const initials =
    name
      ?.trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "";

  return (
    <Avatar
      size={userSizeToAvatarSize[size]}
      className={cn("user-avatar shrink-0 overflow-hidden p-0", className)}
      aria-label={alt || undefined}
    >
      {imageSrc ? (
        <AvatarImage
          key={imageSrc}
          src={imageSrc}
          alt={alt}
          onLoadingStatusChange={(status) => {
            if (status === "error")
              setFailedImages((previous) => new Set(previous).add(imageSrc));
          }}
        />
      ) : null}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}

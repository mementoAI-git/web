import type { ReactNode } from "react";
import { UserAvatar } from "@/components/user-avatar";
import { cn, isEmpty } from "@/utility";

interface UserItemProps {
  name: string;
  email: string;
  image?: string | ReactNode;
  /** Populated beneficiary / API user with optional profile photo */
  user?: { picture_url?: string };
  /** HeroUI Avatar size when using the default gradient / photo avatar */
  avatarSize?: "sm" | "md" | "lg";
  imageClassName?: string;
}

export default function UserItem({
  email,
  image,
  name,
  user,
  avatarSize = "md",
  imageClassName = "",
}: UserItemProps) {
  const photoFromImage = typeof image === "string" && !isEmpty(image) ? image : undefined;
  const photoFromUser =
    !photoFromImage && user?.picture_url && !isEmpty(user.picture_url) ? user.picture_url : undefined;
  const photo = photoFromImage ?? photoFromUser;
  const customVisual = image != null && typeof image !== "string" ? image : null;

  const avatarAlt = !isEmpty(name.trim()) ? name : email;

  return (
    <div className="flex items-center gap-3">
      {customVisual != null ? (
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", imageClassName)}>
          {customVisual}
        </div>
      ) : (
        <UserAvatar
          alt={avatarAlt}
          src={photo}
          name={name}
          email={email}
          size={avatarSize}
          className={imageClassName}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <span className="block truncate font-inter font-medium capitalize text-v3-text-weak">{name}</span>
        <span className="block truncate font-inter text-sm text-text-neutral-weak">{email}</span>
      </div>
    </div>
  );
}

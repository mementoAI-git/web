import { useCallback } from "react";
import { Link } from "react-router-dom";
import Spinner from "@/components/spinner";
import { EditIcon, LogoutIcon } from "@/components/icons";
import { cn, isEmpty } from "@/utility";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import { useLogout } from "@/hooks/use-logout";
import avatarPlaceholder from "@/assets/image/avatar.png";
import { buildSettingsAboutMeParagraphs } from "./build-settings-about-me";
import { useProfileAvatarUpload } from "./use-profile-avatar-upload";

const AVATAR_INPUT_ID = "settings-profile-avatar-input";

/** Profile strip for Settings: avatar + overlay upload, name, short bio, revisit CTA. v3 tokens + motion-safe ≤300ms (userinterface-wiki). */
export function SettingsProfileHeader() {
  const { open } = useModal();
  const { user } = useStore();
  const { logout, loading: logoutLoading } = useLogout();
  const { previewImage, isMutating, handleUpload } = useProfileAvatarUpload();

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() || "Your name";
  const aboutParagraphs = buildSettingsAboutMeParagraphs(user ?? undefined);
  const placeholderBio =
    "Add a short introduction when you revisit preferences — it helps Memento know you better.";
  const aboutPreviewText = aboutParagraphs?.length ? aboutParagraphs.join(" ") : null;

  return (
    <header className="flex w-full flex-col gap-6 pb-1">
      <h1 className="font-inter text-2xl font-semibold leading-tight text-v3-text-strong sm:hidden">Settings</h1>

      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-start sm:gap-4">
        <div className="relative mx-auto shrink-0 sm:mx-0">
          <div
            className={cn(
              "relative size-14 overflow-hidden rounded-xl bg-v3-fill-weaker ring-1 ring-v3-stroke-weak",
              "motion-safe:transition-shadow motion-safe:duration-200 motion-safe:ease-out",
            )}
          >
            <img
              alt="Profile"
              width={56}
              height={56}
              src={!isEmpty(previewImage) ? previewImage : avatarPlaceholder}
              className="size-full object-cover"
            />
            {isMutating && (
              <div className="absolute inset-0 flex items-center justify-center bg-v3-fill-strong/25">
                <Spinner loading className="!mr-0 !size-7 text-v3-text-strong" />
              </div>
            )}
          </div>
          <label
            htmlFor={AVATAR_INPUT_ID}
            className={cn(
              "absolute -right-1 -top-1 flex size-5 cursor-pointer items-center justify-center rounded-full",
              "bg-v3-fill-strong text-white shadow-sm",
              "motion-safe:transition-[transform,opacity,box-shadow] motion-safe:duration-200 motion-safe:ease-out",
              "hover:opacity-90 active:motion-safe:scale-[0.96]",
              "focus-within:ring-2 focus-within:ring-v3-stroke-strong focus-within:ring-offset-2",
            )}
            title="Change profile photo"
          >
            <span className="sr-only">Change profile photo</span>
            <EditIcon className="size-3" strokeWidth={1.25} aria-hidden />
            <input
              id={AVATAR_INPUT_ID}
              type="file"
              accept="image/*"
              hidden
              name="file"
              onChange={handleUpload}
            />
          </label>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="font-garamond text-xl font-medium text-balance text-[var(--v3-text-strong)]">{displayName}</p>
            {user?.email ? (
              <p className="mt-1 font-inter text-sm break-all text-[var(--v3-text-weak)]">{user.email}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            className={cn(
              "mx-auto flex size-11 shrink-0 items-center justify-center rounded-xl sm:mx-0",
              "border border-v3-stroke-weak bg-v3-fill-weaker text-v3-text-strong",
              "motion-safe:transition-[background-color,transform] motion-safe:duration-200 motion-safe:ease-out",
              "hover:bg-v3-fill-weak active:motion-safe:scale-[0.98]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2",
            )}
          >
            {logoutLoading ? (
              <Spinner loading className="!mr-0 size-5! text-v3-fill-strong" />
            ) : (
              <LogoutIcon className="size-5 text-v3-fill-strong" aria-hidden />
            )}
          </button>
        </div>
      </div>

      <div className="flex justify-start gap-3 sm:items-start">
        {aboutPreviewText ? (
          <button
            type="button"
            onClick={() => open("settings-about-me", { paragraphs: aboutParagraphs })}
            className={cn(
              "block min-w-0 w-full flex-1 cursor-pointer text-left",
              "motion-safe:transition-opacity motion-safe:duration-200 motion-safe:ease-out",
              "hover:opacity-90",
              "focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2",
            )}
            aria-label="Read full about me"
          >
            <span className="min-w-0 w-full text-left font-inter text-sm leading-relaxed text-pretty text-v3-text-strong line-clamp-3">
              {aboutPreviewText}
            </span>
          </button>
        ) : (
          <p className="min-w-0 flex-1 font-inter text-sm leading-relaxed text-pretty text-v3-text-strong">
            {placeholderBio}
          </p>
        )}
        <Link
          to="/onboard/misc"
          aria-label="Edit about me"
          className={cn(
            "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full border border-v3-stroke-weak",
            "text-v3-text-strong motion-safe:transition-[background-color,transform] motion-safe:duration-200 motion-safe:ease-out",
            "hover:bg-v3-fill-weaker active:motion-safe:scale-[0.97]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2",
          )}
        >
          <EditIcon className="size-[14px]" strokeWidth={1.25} aria-hidden />
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start">
        <button
          type="button"
          onClick={() => open("memory-insights")}
          className={cn(
            "inline-flex min-h-11 min-w-[200px] cursor-pointer items-center justify-center rounded-full px-5 py-2.5",
            "bg-v3-fill-strong text-center font-inter text-sm font-semibold text-white",
            "motion-safe:transition-[opacity,transform] motion-safe:duration-200 motion-safe:ease-out",
            "hover:opacity-90 active:motion-safe:scale-[0.99]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2",
          )}
        >
          See insights
        </button>
        <Link
          to="/onboard/misc"
          className={cn(
            "inline-flex min-h-11 min-w-[200px] items-center justify-center rounded-full border border-v3-stroke-weak",
            "px-5 py-2.5 text-center font-inter text-sm font-semibold text-v3-text-strong",
            "motion-safe:transition-[background-color,transform] motion-safe:duration-200 motion-safe:ease-out",
            "hover:bg-v3-fill-weaker active:motion-safe:scale-[0.99]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2",
          )}
        >
          <span className="text-pretty">Revisit preferences</span>
        </Link>
      </div>
    </header>
  );
}

import { useMemo } from "react";
import dayjs from "dayjs";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import Spinner from "@/components/spinner";
import { cn, isEmpty } from "@/utility";
import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";
import { useStore } from "@/hooks/use-store";
import { UserAvatar } from "@/components/user-avatar";
import { useProfileAvatarUpload } from "./use-profile-avatar-upload";

const AVATAR_INPUT_ID = "settings-profile-avatar-input";
const actionClass =
  "inline-flex h-8 items-center justify-center rounded-md bg-fill-neutral-weak px-3 font-inter text-sm text-text-neutral-strong transition-colors hover:bg-fill-neutral-weak/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-neutral-strong";

export function SettingsProfileHeader() {
  const { user } = useStore();
  const { trigger: publishProfile, isMutating: sharing } = useFetcher(
    endpoint.shareProfile,
  );
  const { previewImage, isMutating, handleUpload } = useProfileAvatarUpload();
  const rawDisplayName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const displayName = rawDisplayName || user?.nickname?.trim() || "Your name";
  const memberSince = useMemo(
    () => (user?.created_at ? dayjs(user.created_at).format("MMM YYYY") : null),
    [user?.created_at],
  );

  const shareProfile = async () => {
    try {
      const result = await publishProfile({});
      const token = (result?.data as { token?: string } | undefined)?.token;
      if (
        !result?.success ||
        !token ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          token,
        )
      ) {
        toast.error("Could not create your profile link. Please try again.");
        return;
      }
      const url = new URL(`/profile/${token}`, window.location.origin).href;
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${displayName} on Memento`,
            text: "View my Memento profile",
            url,
          });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError")
            return;
          // Browser share can lose gesture permission while preparing the link.
        }
      }
      await navigator.clipboard.writeText(url);
      toast.success("Profile link copied");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        toast.error("Could not share profile. Please try again.");
    }
  };

  return (
    <header className="settings-card flex w-full flex-wrap items-center gap-4 p-4">
      <div className="flex min-w-0 flex-1 basis-full items-center gap-4 sm:basis-auto">
        <label
          htmlFor={AVATAR_INPUT_ID}
          className={cn(
            "relative block size-16 shrink-0 cursor-pointer overflow-hidden rounded-full",
            "focus-within:ring-2 focus-within:ring-stroke-neutral-strong focus-within:ring-offset-2",
          )}
          title="Change profile photo"
        >
          <UserAvatar
            alt="Profile"
            src={!isEmpty(previewImage) ? previewImage : undefined}
            name={rawDisplayName || undefined}
            email={user?.email}
            userId={user?._id}
            size="lg"
            className="!size-full !rounded-full"
          />
          <span className="sr-only">Change profile photo</span>
          <input
            id={AVATAR_INPUT_ID}
            type="file"
            accept="image/*"
            name="file"
            className="sr-only"
            disabled={isMutating}
            aria-busy={isMutating}
            onChange={handleUpload}
          />
          {isMutating && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-fill-neutral-strong/25">
              <Spinner
                loading
                className="!mr-0 !size-5 text-text-neutral-strong"
              />
            </div>
          )}
        </label>
        <div className="min-w-0 flex-1 space-y-1 text-left">
          <h2 className="break-words text-xl font-bold text-text-neutral-strong sm:text-2xl">
            {displayName}
          </h2>
          <p className="flex flex-wrap items-center justify-start gap-y-1 text-left text-sm text-text-neutral-weak">
            {user?.email && <span className="max-w-full truncate" title={user.email}>{user.email}</span>}
            {memberSince && (
              <span className="inline-flex items-center">
                {user?.email && (
                  <span
                    className="mx-2 size-1 shrink-0 rounded-full bg-current"
                    aria-hidden
                  />
                )}
                <span>Joined {memberSince}</span>
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="hidden">
        <button
          type="button"
          className={`${actionClass} gap-2 !hidden`}
          hidden
          disabled={sharing}
          onClick={() => void shareProfile()}
        >
          <Share2 className="size-4" aria-hidden />
          {sharing ? "Preparing…" : "Share"}
        </button>
      </div>
    </header>
  );
}

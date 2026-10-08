import { useMemo } from "react";
import dayjs from "dayjs";
import { ProfileBanner } from "./profile-banner";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import Spinner from "@/components/spinner";
import { cn, isEmpty } from "@/utility";
import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";
import { useApi } from "@/hooks/use-api";
import type { IPersona } from "@/utility/interface";
import { SocialProfileLinks } from "@/features/profile/social-profile-links";
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
  const { data: persona } = useApi<IPersona | null>(endpoint.persona, {
    refreshInterval: 30000,
  });
  const { previewImage, isMutating, handleUpload } = useProfileAvatarUpload();
  const rawDisplayName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const displayName = rawDisplayName || "Your name";
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
    <header className="w-full">
      <ProfileBanner />
      <div className="relative -mt-10 px-6 pb-2 sm:px-8">
        <label
          htmlFor={AVATAR_INPUT_ID}
          className={cn(
            "relative block size-20 cursor-pointer overflow-hidden rounded-full",
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
            onChange={handleUpload}
          />
          {isMutating && (
            <div className="absolute inset-0 flex items-center justify-center bg-fill-neutral-strong/25">
              <Spinner
                loading
                className="!mr-0 !size-5 text-text-neutral-strong"
              />
            </div>
          )}
        </label>
        <h2 className="mt-6 font-garamond text-3xl font-medium text-text-neutral-strong sm:text-4xl">
          {displayName}
        </h2>
        <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex flex-wrap items-center justify-start gap-y-1 font-inter text-sm text-v3-text-weak">
            {user?.email && <span className="break-all">{user.email}</span>}
            {memberSince && (
              <>
                <span
                  className="mx-3 size-1 rounded-full bg-current opacity-40"
                  aria-hidden
                />
                <span>Member since {memberSince}</span>
              </>
            )}
          </p>
          <div
            className="flex flex-wrap shrink-0 items-center gap-3 text-text-neutral-weaker"
            aria-label="Social profiles"
          >
            <SocialProfileLinks accounts={persona?.data?.social_accounts} />
            <button
              type="button"
              className={`${actionClass} gap-2`}
              disabled={sharing}
              onClick={() => void shareProfile()}
            >
              <Share2 className="size-4" aria-hidden />
              {sharing ? "Preparing…" : "Share"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

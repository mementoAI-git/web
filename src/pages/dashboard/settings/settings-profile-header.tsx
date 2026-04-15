import { useMemo } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import Spinner from "@/components/spinner";
import { EditIcon } from "@/components/icons";
import profileHeaderBg from "@/assets/image/overview get started bg.png";
import { cn, isEmpty } from "@/utility";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import { UserAvatar } from "@/components/user-avatar";
import { buildSettingsAboutMeParagraphs } from "./build-settings-about-me";
import { useProfileAvatarUpload } from "./use-profile-avatar-upload";
import endpoint from "@/api/endpoint";

const AVATAR_INPUT_ID = "settings-profile-avatar-input";

function enrichmentLabel(score: number): string {
  if (score <= 0) return "Not started yet";
  if (score < 26) return "Just getting started";
  if (score < 51) return "Building momentum";
  if (score < 76) return "Good progress";
  if (score < 91) return "Nearly complete";
  return "Fully enriched";
}

/** Profile strip for Settings: avatar + overlay upload, name, member since, stats band, bio, CTAs. */
export function SettingsProfileHeader() {
  const { open } = useModal();
  const { user } = useStore();
  const { previewImage, isMutating, handleUpload } = useProfileAvatarUpload();
  const { data: statsData } = useSWR(endpoint.userStats);
  const { data: memoriesStatsData } = useSWR(endpoint.memoriesStats);

  const rawDisplayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  const displayName = rawDisplayName || "Your name";
  const aboutParagraphs = buildSettingsAboutMeParagraphs(user ?? undefined);
  const placeholderBio =
    "Add a short introduction when you revisit preferences. It helps Memento know you better.";
  const aboutPreviewText = aboutParagraphs?.length ? aboutParagraphs.join(" ") : null;

  const memberSince = useMemo(() => {
    if (!user?.created_at) return null;
    return dayjs(user.created_at).format("MMM YYYY");
  }, [user?.created_at]);

  const stats = statsData?.data ?? {};
  const enrichmentScore = Number(stats.enrichment_score) || 0;
  const streakCount = Number(user?.streak) || Number(stats.streak_count) || 0;
  const memoriesCount =
    memoriesStatsData?.data?.stories_count ?? memoriesStatsData?.stories_count ?? 0;
  const topDimension: string | null = stats.top_dimension ?? null;

  return (
    <header className="flex w-full flex-col gap-8 pb-1">
      <h1 className="font-inter text-2xl font-semibold leading-tight text-v3-text-strong sm:hidden">
        Settings
      </h1>

      {/* Profile card with background image */}
      <div
        className="w-full overflow-hidden rounded-2xl bg-cover bg-center px-5 py-6"
        style={{ backgroundImage: `url(${profileHeaderBg})` }}
      >
        {/* Avatar · name · email · member since */}
        <div className="flex w-full flex-col justify-start gap-4 sm:flex-row sm:items-start sm:gap-5">
          <div className="relative mx-auto shrink-0 sm:mx-0">
            <div
              className={cn(
                "relative size-14 overflow-hidden rounded-xl",
                "motion-safe:transition-shadow motion-safe:duration-200 motion-safe:ease-out",
              )}
            >
              <UserAvatar
                alt="Profile"
                src={!isEmpty(previewImage) ? previewImage : undefined}
                name={rawDisplayName || undefined}
                email={user?.email}
                size="lg"
                className="size-full !rounded-xl ring-1 ring-v3-stroke-weak"
              />
              {isMutating && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-v3-fill-strong/25">
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

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 text-center sm:text-left">
            <p className="font-garamond text-xl font-medium text-balance text-v3-text-strong">
              {displayName}
            </p>
            <p className="flex items-center justify-start font-inter text-sm text-v3-text-weak">
              {user?.email && <span className="break-all">{user.email}</span>}
              {memberSince && (
                <>
                  <span className="mx-1.5 inline-block size-1 shrink-0 translate-y-px rounded-full bg-current opacity-40" aria-hidden />
                  <span>Member since {memberSince}</span>
                </>
              )}
            </p>
            {aboutPreviewText ? (
              <button
                type="button"
                onClick={() => open("settings-about-me", { paragraphs: aboutParagraphs })}
                className={cn(
                  "mt-1 block min-w-0 w-full cursor-pointer text-left",
                  "motion-safe:transition-opacity motion-safe:duration-200 motion-safe:ease-out",
                  "hover:opacity-90",
                  "focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2",
                )}
                aria-label="Read full about me"
              >
                <span className="min-w-0 w-full text-left font-inter text-sm leading-relaxed text-pretty text-v3-text-weak line-clamp-2">
                  {aboutPreviewText}
                </span>
              </button>
            ) : (
              <p className="mt-1 min-w-0 font-inter text-sm leading-relaxed text-pretty text-v3-text-weaker">
                {placeholderBio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats band */}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <div className="flex flex-col gap-3">
          <span className="font-inter text-xs text-v3-text-weaker">Enrichment score</span>
          <span className="font-garamond text-[2rem] font-normal leading-none text-v3-text-strong tabular-nums">
            {enrichmentScore}%
          </span>
          <div className="flex flex-col gap-1.5">
            <div className="h-1 w-full overflow-hidden rounded-full bg-v3-fill-weak">
              <div
                className="h-full rounded-full bg-v3-brand-strong transition-[width] duration-500"
                style={{ width: `${enrichmentScore}%` }}
              />
            </div>
            <span className="font-inter text-xs text-v3-text-weaker">{enrichmentLabel(enrichmentScore)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span className="font-inter text-xs text-v3-text-weaker">Memories captured</span>
          <span className="font-garamond text-[2rem] font-normal leading-none text-v3-text-strong tabular-nums">
            {memoriesCount}
          </span>
          <span className="font-inter text-xs text-v3-text-weaker">Across all dimensions</span>
        </div>

        <div className="flex flex-col gap-3">
          <span className="font-inter text-xs text-v3-text-weaker">Active streak</span>
          <span className="font-garamond text-[2rem] font-normal leading-none text-v3-text-strong tabular-nums">
            {streakCount}
          </span>
          <span className="font-inter text-xs text-v3-text-weaker">days in a row</span>
        </div>

        <div className="flex flex-col gap-3">
          <span className="font-inter text-xs text-v3-text-weaker">Top dimension</span>
          <span className="font-garamond text-xl font-normal leading-tight text-v3-text-strong line-clamp-2">
            {topDimension ?? "—"}
          </span>
          <span className="font-inter text-xs text-v3-text-weaker">Most entries logged</span>
        </div>
      </div>

    </header>
  );
}

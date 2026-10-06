import { OverviewVoiceSlot, useVoiceSession } from "@/contexts/voice-session";
import { InlineVoiceSession } from "@/components/Chatinput/inline-voice-session";
import { useNavigate } from "react-router-dom";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import storyIllustration from "@/assets/image/overview/story-illustration.png";
import bannerPattern from "@/assets/image/overview/banner-pattern.png";
import brightButtonIcon from "@/assets/icon/noto_bright-button.svg";
import moonfaceIcon from "@/assets/icon/moonface.svg";
import {
  getGreetingPunctuation,
  shouldUseBrightWelcomeIcon,
} from "./welcome-section-helpers";
import { PencilLine, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TypographyH1, TypographyH2 } from "@/components/ui/typography";

function getGreeting(): string {
  const hour = new Date().getHours();
  const greetings =
    hour >= 4 && hour < 7
      ? ["Up early today,", "Starting the day early,", "Rise and shine,"]
      : hour >= 7 && hour < 12
        ? ["Good morning,", "Back at it,", "Morning,"]
        : hour >= 12 && hour < 17
          ? ["Good afternoon,", "Welcome back,", "Afternoon,"]
          : hour >= 17 && hour < 21
            ? ["Good evening,", "Evening,", "Ready to reflect,"]
            : hour >= 21
              ? [
                  "Keeping a late night,",
                  "Night owl mode,",
                  "Burning the midnight oil,",
                ]
              : ["Still going,", "Can't sleep,", "Late night session,"];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

export default function WelcomeSection() {
  const { user } = useStore();
  const voice = useVoiceSession();
  const [localVoiceActive, setLocalVoiceActive] = useState(false);
  const voiceActive = voice?.active ?? localVoiceActive;
  const setVoiceActive = (active: boolean) => {
    if (voice) {
      if (active) voice.start({ memoryId: voiceProfile?.data?.primary_conversation_id ?? user?.primary_conversation_id ?? null });
      else voice.end();
    } else setLocalVoiceActive(active);
  };
  const { data: voiceProfile, error: voiceProfileError, mutate: retryVoiceProfile } = useSWR(endpoint.profile);
  const navigate = useNavigate();
  const { open } = useModal();
  const greeting = useMemo(() => getGreeting(), []);
  const [useBrightWelcomeIcon, setUseBrightWelcomeIcon] = useState(() =>
    shouldUseBrightWelcomeIcon(),
  );
  useEffect(() => {
    const sync = () => setUseBrightWelcomeIcon(shouldUseBrightWelcomeIcon());
    sync();
    const id = window.setInterval(sync, 60_000);
    return () => window.clearInterval(id);
  }, []);
  const { data: statsData, mutate: mutateUserStats } = useSWR(
    endpoint.userStats,
  );
  const stats = statsData?.data ?? {};
  const quickPending = Number(stats.quick_capture_pending_count) || 0;
  const quickLatestId =
    typeof stats.quick_capture_latest_id === "string"
      ? stats.quick_capture_latest_id
      : null;

  useEffect(() => {
    if (quickPending <= 0) return;
    const id = window.setInterval(() => {
      void mutateUserStats();
    }, 4000);
    return () => window.clearInterval(id);
  }, [quickPending, mutateUserStats]);
  return (
    <section className="flex w-full flex-col gap-6">
      <div className="flex min-w-0 items-center gap-2.5">
        <img
          src={useBrightWelcomeIcon ? brightButtonIcon : moonfaceIcon}
          alt=""
          className="size-8 shrink-0 sm:size-[38px]"
        />
        <TypographyH1 className="min-w-0 font-garamond text-[28px] font-normal leading-[1.2] tracking-normal text-text-neutral-strong sm:text-[40px] lg:text-[40px]">
          {greeting}
          {(user?.nickname || user?.first_name || user?.last_name) && (
            <i className="text-overview-greeting">
              {" "}
              {user?.nickname || user?.first_name || user?.last_name}
              {getGreetingPunctuation(greeting)}
            </i>
          )}
        </TypographyH1>
      </div>
      {voiceActive && voice ? <OverviewVoiceSlot /> : voiceActive ? (
          voiceProfile?.data ? <InlineVoiceSession variant="overview" memoryId={voiceProfile.data.primary_conversation_id ?? null} onEnd={() => setVoiceActive(false)} /> : (
            <div className="flex items-center gap-3">
              <p role="status" className="text-sm text-text-neutral-weak">{voiceProfileError ? "Couldn’t prepare voice." : "Preparing voice…"}</p>
              {voiceProfileError && <Button variant="outline" onClick={() => void retryVoiceProfile()}>Try again</Button>}
              <Button variant="ghost" onClick={() => setVoiceActive(false)}>Cancel</Button>
            </div>
          )
        ) : (
      <div className="relative isolate flex min-h-[178px] flex-col justify-between gap-8 overflow-hidden rounded-3xl bg-[image:var(--gradient-overview-banner)] p-6">
        <img
          src={bannerPattern}
          alt=""
          aria-hidden
          className="pointer-events-none absolute -top-[203px] left-1/2 -z-10 h-[592px] w-[817px] max-w-none -translate-x-1/2"
        />
        <div className="flex items-start justify-between gap-4 sm:pr-[144px]">
          <TypographyH2 className="font-garamond text-[24px] font-normal leading-[34px] tracking-normal text-text-neutral-strong sm:text-[30px] lg:text-[30px]">
            What’s on your mind today?
          </TypographyH2>
          <img
            src={storyIllustration}
            alt=""
            className="absolute right-6 top-6 hidden h-[94px] w-[128px] object-contain sm:block"
          />
        </div>
        <div className="relative flex flex-wrap items-center gap-4">
          <Button
            type="button"
            onClick={() => open("create-memory")}
            className="h-10 w-[130px] gap-2 rounded-lg px-4 font-inter text-sm font-semibold [background-image:var(--gradient-overview-story)]"
          >
            <PencilLine className="size-5" aria-hidden />
            Add story
          </Button>
          <Button
            type="button"
            onClick={() => setVoiceActive(true)}
            className="h-10 w-[193px] gap-2 rounded-lg bg-fill-overview-voice px-4 font-inter text-sm font-semibold text-overview-voice [background-image:none] hover:bg-fill-overview-voice/90"
          >
              <PhoneCall className="size-5" aria-hidden />
              Voice conversation
          </Button>
        </div>
      </div>
      )}

      {quickPending > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (quickLatestId) navigate(`/chat/${quickLatestId}`);
              else navigate("/stories");
            }}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-stroke-neutral-weak bg-fill-neutral-weaker px-4 py-2 font-inter text-sm font-medium text-text-neutral-strong transition-colors hover:bg-fill-neutral-weak sm:w-auto sm:min-h-0"
          >
            <span className="text-text-brand-strong">{quickPending}</span>
            <span>
              {quickPending === 1
                ? "Quick capture finishing up"
                : `${quickPending} quick captures finishing up`}
            </span>
          </button>
        </div>
      ) : null}
    </section>
  );
}

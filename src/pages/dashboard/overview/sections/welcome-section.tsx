import "../overview-motion.css";
import { MotionHeading } from "@/components/motion/text-reveal";
import { toast } from "sonner";
import { OverviewCaptureCard } from "./overview-capture-card";
import { OverviewVoiceSlot, useVoiceSession } from "@/contexts/voice-session";
import { InlineVoiceSession } from "@/components/Chatinput/inline-voice-session";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/hooks/use-store";
import { useModal } from "@/hooks/use-modal";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import brightButtonIcon from "@/assets/icon/noto_bright-button.svg";
import moonfaceIcon from "@/assets/icon/moonface.svg";
import {
  getGreetingPunctuation,
  shouldUseBrightWelcomeIcon,
} from "./welcome-section-helpers";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TypographyH1 } from "@/components/ui/typography";

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
  const { data: voiceProfile, error: voiceProfileError } = useSWR(endpoint.profile);
  useEffect(() => {
    if (!voiceActive || voice || !voiceProfileError) return;
    toast.error("Couldn’t prepare voice. Please try again.");
    setLocalVoiceActive(false);
  }, [voiceActive, voice, voiceProfileError]);
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
    <section className="overview-motion flex w-full flex-col gap-6">
      <MotionHeading className="flex min-w-0 items-center gap-3">
        <img
          src={useBrightWelcomeIcon ? brightButtonIcon : moonfaceIcon}
          alt=""
          className="size-[34px] shrink-0 sm:size-[44px]"
        />
        <TypographyH1 className="t-stagger-line min-w-0 font-garamond text-[28px] font-normal leading-[34px] sm:leading-[1.2] tracking-normal text-text-neutral-strong sm:text-[48px] lg:text-[48px]">
          {greeting}
          {(user?.nickname || user?.first_name || user?.last_name) && (
            <i className="text-text-neutral-weak">
              {" "}
              {user?.nickname || user?.first_name || user?.last_name}
              {getGreetingPunctuation(greeting)}
            </i>
          )}
        </TypographyH1>
      </MotionHeading>
      {voiceActive && voice ? <OverviewVoiceSlot /> : voiceActive ? (
          voiceProfile?.data ? <InlineVoiceSession variant="overview" memoryId={voiceProfile.data.primary_conversation_id ?? null} onEnd={() => setVoiceActive(false)} /> : (
            <div className="flex items-center gap-3">
              <p role="status" className="text-sm text-text-neutral-weak"><span className="t-shimmer" data-text="Preparing voice…">Preparing voice…</span></p>
              <Button variant="ghost" onClick={() => setVoiceActive(false)}>Cancel</Button>
            </div>
          )
        ) : (
      <OverviewCaptureCard key={user?._id ?? "guest"} userId={user?._id} onVoiceConversation={() => setVoiceActive(true)} />
      )}

      {quickPending > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (quickLatestId) open("view-memory", { memoryId: quickLatestId });
              else navigate("/stories");
            }}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-stroke-neutral-weak bg-fill-neutral-weaker px-4 py-2 font-inter text-sm font-medium text-text-neutral-strong transition-colors hover:bg-fill-neutral-weak sm:w-auto sm:min-h-0"
          >
            <Spinner aria-hidden role="presentation" className="shrink-0 text-icon-brand-strong motion-reduce:animate-none" />
            <span className="text-text-brand-strong">{quickPending}</span>{" "}
            <span aria-live="polite">
              {quickPending === 1
                ? "Quick note finishing up…"
                : "Quick notes finishing up…"}
            </span>
          </button>
        </div>
      ) : null}
    </section>
  );
}

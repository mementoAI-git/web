import { ABOUT_LIMIT } from "./limits";
import { reportFetcherError } from "@/api/report-fetcher-error";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";
import { useStore } from "@/hooks/use-store";
import Spinner from "@/components/spinner";
import { onboardingAssets as assets } from "./assets";
import { lifeAreaOptions, reasonOptions } from "./flow-options";
import {
  clearOnboardingDraft,
  useOnboardingDraft,
} from "./use-onboarding-draft";
import {
  OnboardingActions,
  OnboardingButton,
  OnboardingCard,
  OnboardingQuestionFrame,
  OnboardingTitle,
} from "./components/onboarding-card";
import { LifeAreaChip } from "./components/life-area-chip";
import posthog from "@/lib/posthog";
import { useFinishOnboarding } from "./use-finish-onboarding";
import { resetOnboardingTracking, useTrackOnboardingStep } from "./onboarding-analytics";

export default function OnboardingSummaryPage() {
  useTrackOnboardingStep("summary");
  const { user } = useStore();
  const finishOnboarding = useFinishOnboarding();
  const navigate = useNavigate();
  const userId = user?._id ?? "anonymous";
  const [draft, setDraft] = useOnboardingDraft(userId);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const { trigger: completeOnboarding, isMutating } = useFetcher(
    endpoint.completeOnboarding,
  );
  const nickname = user?.nickname || user?.first_name || "there";
  const selectedReasons = reasonOptions.filter((option) =>
    draft.reasons.includes(option.value),
  );
  const why = selectedReasons.length
    ? "To " +
      selectedReasons.map((option) => option.summary).join(", and ") +
      "."
    : "You’re exploring what Memento can offer, at your own pace.";
  const handleContinue = async () => {
    if (draft.about.length > ABOUT_LIMIT) {
      setDraft((value) => ({ ...value, step: 2 }));
      navigate("/onboarding/misc");
      return;
    }
    if (savingRef.current || isMutating) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const result = await completeOnboarding({
        self_description: draft.about.trim() || undefined,
        current_priority: draft.areas,
        join_reasons: draft.reasons,
        motivationType: selectedReasons[0]?.motivation ?? "explorer",
        stepReached: 4,
        skippedDeepPersonalization: false,
      });
      if (!result?.success) throw new Error(result?.message || "Couldn’t save onboarding");
      if (posthog.__loaded) {
        posthog.capture("onboarding_completed", {
          life_area_count: draft.areas.length,
          join_reason_count: draft.reasons.length,
          motivation_type: selectedReasons[0]?.motivation ?? "explorer",
        });
      }
      resetOnboardingTracking();
      finishOnboarding("completed");
      clearOnboardingDraft(userId);
      navigate("/overview");
    } catch (error) {
      reportFetcherError(error, "We couldn’t save your onboarding. Please try again.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };
  return (
    <OnboardingQuestionFrame step={4}>
      <OnboardingCard>
        <div className="flex flex-col gap-3">
          <img
            src={assets["19031-32307/imgNotoBeachWithUmbrella"]}
            alt=""
            className="self-start"
          />
          <OnboardingTitle className="sm:max-w-[467px]">
            Alright <em className="text-text-brand-strong">{nickname},</em>{" "}
            you’re ready to dive right in
          </OnboardingTitle>
        </div>
        <p className="text-xl leading-7">
          We now have a starting point for getting to know you. Memento AI will
          use what you’ve shared to shape your prompts &amp; conversations.
        </p>
        <div className="flex flex-col gap-3">
          <section
            aria-labelledby="why-heading"
            className="flex flex-col gap-2 rounded-2xl border border-stroke-info-weak bg-fill-info-weak px-[15px] py-[11px] text-sm leading-5"
          >
            <h2
              id="why-heading"
              className="font-semibold text-text-info-strong"
            >
              Why you’re here
            </h2>
            <p className="font-azeret break-words">{why}</p>
          </section>
          <section
            aria-labelledby="about-heading"
            className="border-stroke-onboarding-about bg-fill-onboarding-about flex flex-col gap-2 rounded-2xl border px-[15px] py-[11px] text-sm leading-5"
          >
            <h2
              id="about-heading"
              className="font-semibold text-text-onboarding-about"
            >
              About you
            </h2>
            <p className="font-azeret whitespace-pre-wrap break-words">
              {draft.about.trim() ||
                "You can tell us more about yourself whenever you’re ready."}
            </p>
          </section>
          <section
            aria-labelledby="starting-heading"
            className="flex flex-col gap-2 rounded-2xl border border-stroke-brand-weak bg-fill-brand-weak px-[15px] py-[11px] text-sm leading-5"
          >
            <h2
              id="starting-heading"
              className="font-semibold text-text-brand-strong"
            >
              Starting areas
            </h2>
            <div className="flex flex-wrap gap-2">
              {lifeAreaOptions
                .filter((option) => draft.areas.includes(option.value))
                .map((option) => (
                  <LifeAreaChip key={option.value} option={option} />
                ))}
              {!draft.areas.length && (
                <p className="font-azeret">
                  Choose your starting areas when you’re ready.
                </p>
              )}
            </div>
          </section>
          <p className="flex items-center gap-2 px-2 py-0.5 text-sm leading-5 text-text-neutral-weak">
            <img
              src={assets["19031-32307/imgInfoCircle"]}
              alt=""
              className="shrink-0 dark:invert"
            />
            You can always edit or build on this later
          </p>
        </div>

        <OnboardingActions>
          <OnboardingButton
            variant="outline"
            disabled={saving || isMutating}
            onClick={() => navigate("/onboarding/misc")}
          >
            Back
          </OnboardingButton>
          <OnboardingButton
            disabled={saving || isMutating}
            onClick={() => void handleContinue()}
          >
            <span>Continue</span>
            <Spinner loading={saving || isMutating} className="!size-4" />
          </OnboardingButton>
        </OnboardingActions>
      </OnboardingCard>
    </OnboardingQuestionFrame>
  );
}

import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchOnboardingDetails } from "@/api/onboarding";
import { migrateLegacyPriorityList } from "@/features/enrichment/enrichment-categories";
import { useStore } from "@/hooks/use-store";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { onboardingAssets as assets } from "../assets";
import {
  inspirationOptions,
  lifeAreaOptions,
  reasonOptions,
} from "../flow-options";
import { useOnboardingDraft } from "../use-onboarding-draft";
import {
  OnboardingActions,
  OnboardingButton,
  OnboardingCard,
  OnboardingQuestionFrame,
  OnboardingTitle,
} from "../components/onboarding-card";
import { LifeAreaChip } from "../components/life-area-chip";

export default function MiscPage() {
  const { user } = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRevisit = searchParams.get("mode") === "revisit";
  const [loadingSaved, setLoadingSaved] = useState(isRevisit);
  const savedAbout = user?.context?.self_description ?? "";
  const nickname = user?.nickname || user?.first_name || "there";
  const [draft, setDraft] = useOnboardingDraft(user?._id ?? "anonymous");
  useEffect(() => {
    if (!isRevisit || !user?._id) return;
    let cancelled = false;
    fetchOnboardingDetails().then((details) => {
      if (cancelled) return;
      if (details) {
        const knownReasons = reasonOptions
          .filter((option) =>
            details.persona.join_reasons.includes(option.value),
          )
          .map((option) => option.value);
        const fallbackReason = reasonOptions.find(
          (option) => option.value === details.persona.motivation,
        )?.value;
        setDraft((value) => ({
          ...value,
          step: 1,
          reasons: knownReasons.length
            ? knownReasons
            : fallbackReason
              ? [fallbackReason]
              : value.reasons,
          about: savedAbout.slice(0, 500) || value.about,
          areas: migrateLegacyPriorityList(
            details.persona.current_priority,
          ).slice(0, 3),
        }));
      }
      setLoadingSaved(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isRevisit, user?._id, savedAbout, setDraft]);
  const headingRef = useRef<HTMLDivElement>(null);
  const previousStep = useRef(draft.step);
  useEffect(() => {
    if (draft.step !== previousStep.current) {
      headingRef.current?.focus();
      previousStep.current = draft.step;
    }
  }, [draft.step]);
  const canContinue =
    !loadingSaved &&
    (draft.step === 1
      ? draft.reasons.length > 0
      : draft.step === 2
        ? draft.about.trim().length > 0
        : draft.areas.length >= 2);
  const goBack = () => {
    if (draft.step === 1) navigate("/onboarding/nickname");
    else setDraft((value) => ({ ...value, step: value.step === 3 ? 2 : 1 }));
  };
  const goNext = () => {
    if (!canContinue) return;
    if (draft.step === 3) navigate("/onboarding/summary");
    else setDraft((value) => ({ ...value, step: value.step === 1 ? 2 : 3 }));
  };

  return (
    <OnboardingQuestionFrame step={draft.step}>
      <OnboardingCard>
        <div
          ref={headingRef}
          tabIndex={-1}
          className="flex flex-col gap-3 outline-none"
        >
          <div aria-hidden className="relative size-10">
            {draft.step === 1 && (
              <img
                src={assets["19031-32042/imgGroup"]}
                alt=""
                className="absolute left-[6.25%] top-[6.25%]"
              />
            )}
            {draft.step === 2 && (
              <img
                src={assets["19031-32152/imgGroup"]}
                alt=""
                className="absolute left-[16.67%] top-[8.33%]"
              />
            )}
            {draft.step === 3 && (
              <img
                src={assets["19031-32212/imgGroup"]}
                alt=""
                className="absolute left-[6.25%] top-[18.75%]"
              />
            )}
          </div>
          {draft.step === 1 && (
            <OnboardingTitle className="sm:max-w-[440px]">
              Okay <em className="text-text-brand-strong">{nickname}</em>, let’s
              get started
            </OnboardingTitle>
          )}
          {draft.step === 2 && (
            <OnboardingTitle className="sm:max-w-[416px]">
              Tell us a little bit about yourself,{"\u00a0\u00a0"}
              <em className="text-text-brand-strong">{nickname}</em>
            </OnboardingTitle>
          )}
          {draft.step === 3 && (
            <OnboardingTitle className="sm:max-w-[467px]">
              Which parts of your life would you like <em>explore</em> first?
            </OnboardingTitle>
          )}
        </div>
        <p className="font-geist text-xl leading-7 text-text-neutral-strong">
          {draft.step === 1
            ? "First off, what brings you to Memento AI?"
            : draft.step === 2
              ? "Share anything you think would help Memento learn about you. Just something to give us a starting point."
              : "Pick 2 to 3 areas. We’ll prioritize prompts and suggestions around these to help you start."}
        </p>
        {draft.step === 1 && (
          <div
            role="group"
            aria-label="What brings you to Memento AI?"
            className="flex flex-col gap-2.5"
          >
            {reasonOptions.map((option) => {
              const selected = draft.reasons.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    setDraft((value) => ({
                      ...value,
                      reasons: selected
                        ? value.reasons.filter(
                            (reason) => reason !== option.value,
                          )
                        : [...value.reasons, option.value],
                    }))
                  }
                  className={cn(
                    "flex min-h-[52px] w-full cursor-pointer items-center gap-3 rounded-lg border bg-bg-neutral px-[15px] py-[13px] text-left font-geist text-base leading-6 text-text-neutral-strong transition-colors hover:bg-fill-neutral-weaker focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-brand-strong",
                    selected
                      ? "border-stroke-neutral-strong"
                      : "border-stroke-neutral-weak",
                  )}
                >
                  <span
                    aria-hidden
                    className="relative flex size-6 shrink-0 items-center justify-center"
                  >
                    <img src={option.icon} alt="" />
                  </span>
                  <span className="flex-1">{option.label}</span>
                  {selected && (
                    <img
                      src={assets["19031-32042/imgLetsIconsCheckFill"]}
                      alt=""
                      className="shrink-0"
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
        {draft.step === 2 && (
          <>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="onboarding-about"
                className="text-sm font-medium leading-5"
              >
                Enter About info
              </label>
              <div className="relative">
                <Textarea
                  id="onboarding-about"
                  value={draft.about}
                  maxLength={500}
                  aria-describedby="about-counter"
                  onChange={(event) =>
                    setDraft((value) => ({
                      ...value,
                      about: event.target.value.slice(0, 500),
                    }))
                  }
                  placeholder="Eg: I am a software engineer and a father of 2 living in Dubln. I care about family, creativity and personal growth. Lately i’ve been focused on building the things i’m proud of..."
                  className="h-[196px] rounded-2xl border-stroke-neutral-weak bg-fill-neutral-weaker px-3 py-2 pb-9 font-geist text-base leading-6 text-text-neutral-strong placeholder:text-text-neutral-weaker md:text-base"
                />
                <p
                  id="about-counter"
                  className="pointer-events-none absolute right-3 bottom-2 text-sm leading-5"
                >
                  {draft.about.length}/500
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="font-azeret text-sm leading-5 text-text-neutral-weak">
                Need inspiration?
              </p>
              <div className="flex flex-wrap gap-2">
                {inspirationOptions.map((option) => (
                  <span
                    key={option.label}
                    className="rounded-full border border-stroke-neutral-weak bg-bg-neutral px-[15px] py-2.5 text-xs leading-4 text-text-neutral-strong"
                  >
                    {option.label}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
        {draft.step === 3 && (
          <div className="flex flex-col gap-1.5">
            <p
              id="life-areas-label"
              className="font-azeret text-sm leading-5 text-text-neutral-weak"
            >
              Life areas
            </p>
            <div
              role="group"
              aria-labelledby="life-areas-label"
              className="flex flex-wrap gap-2"
            >
              {lifeAreaOptions.map((option) => (
                <LifeAreaChip
                  key={option.value}
                  option={option}
                  selected={draft.areas.includes(option.value)}
                  disabled={
                    draft.areas.length === 3 &&
                    !draft.areas.includes(option.value)
                  }
                  onClick={() =>
                    setDraft((value) => ({
                      ...value,
                      areas: value.areas.includes(option.value)
                        ? value.areas.filter((area) => area !== option.value)
                        : value.areas.length < 3
                          ? [...value.areas, option.value]
                          : value.areas,
                    }))
                  }
                />
              ))}
            </div>
          </div>
        )}
        <OnboardingActions>
          <OnboardingButton variant="outline" onClick={goBack}>
            Back
          </OnboardingButton>
          <OnboardingButton onClick={goNext} disabled={!canContinue}>
            Continue
          </OnboardingButton>
        </OnboardingActions>
      </OnboardingCard>
    </OnboardingQuestionFrame>
  );
}

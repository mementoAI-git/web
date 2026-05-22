"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "@/hooks/use-store";
import { isEmpty } from "@/utility";
import {
  AGE_BAND_OPTIONS,
  MISC_MOTIVATION_OPTIONS,
  LIFE_SITUATION_OPTIONS,
  PERSONALITY_TRAIT_OPTIONS,
  MEMORY_TREASURE_OPTIONS,
  HOME_PLACE_SUGGESTION_OPTIONS,
  MISC_PASSION_OPTIONS,
  CHRONOTYPE_OPTIONS,
  SHARING_INTENT_OPTIONS,
  ONBOARDING_FOCUS_FIRST_OPTIONS,
} from "@/features/onboarding-groot/types";
import type {
  MiscMotivationChip,
  MotivationType,
  PersonalityTraitKey,
  MemoryTreasureKey,
  PassionKey,
} from "@/features/onboarding-groot/types";
import { getPrimaryCTA, getStep5Body } from "@/features/onboarding-groot/adaptive";
import { OnboardSelectionCard } from "./OnboardSelectionCard";
import { OnboardQuestionHeader } from "./OnboardQuestionHeader";
import {
  useOnboardQuestionsState,
  ONBOARD_QUESTIONS_STEP_LABELS,
  MAX_PERSONALITY_TRAITS,
  MAX_MEMORY_TREASURES,
  MAX_PASSIONS_MISC,
  MAX_FOCUS_FIRST,
} from "./useOnboardQuestionsState";
import type { OnboardQuestionsStep } from "./useOnboardQuestionsState";
import { ONBOARD_MISC_WHY } from "./onboard-misc-copy";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";
import { mutate } from "swr";
import {
  fetchOnboardingDetails,
  mapOnboardingDetailsToMiscState,
} from "@/api/onboarding";
import {
  deriveTouchedCategoriesFromMiscState,
  saveOnboardingSummarySnapshot,
  type PostOnboardingAction,
} from "../summary-helpers";

function primaryLifeSituationForApi(
  values: LifeSituationKey[],
): LifeSituationKey | null {
  return values.find((value) => value !== "something_else") ?? values[0] ?? null;
}

function motivationForApi(
  chips: MiscMotivationChip[],
): MotivationType {
  const primary = chips.find((chip) => chip !== "something_else");
  if (!primary) return "explorer";
  return primary as MotivationType;
}

function progressDots(step: OnboardQuestionsStep): {
  completed: (i: number) => boolean;
  current: (i: number) => boolean;
} {
  return {
    completed: (i: number) =>
      step === 12 ||
      (step <= 5 && i < step) ||
      (step === 6 && i < 5) ||
      (step >= 7 && step <= 11 && i < step - 1),
    current: (i: number) =>
      step !== 12 &&
      ((step <= 5 && step === i) ||
        (step === 6 && i === 5) ||
        (step >= 7 && step <= 11 && step - 1 === i)),
  };
}

const TOTAL_QUESTION_DOTS = 10;
const fieldClassName =
  "border border-[#D0D5DD] bg-white text-v3-text-strong shadow-[0_1px_2px_rgba(16,24,40,0.05)] placeholder:text-v3-text-weaker focus-visible:border-v3-brand-strong focus-visible:ring-v3-brand-strong/20";
const primaryButtonClassName =
  "flex h-14 w-full items-center justify-center gap-2 rounded-full border-0 bg-[rgba(23,11,0,0.9)] px-8 text-sm font-semibold leading-5 text-white shadow-none transition-[transform,opacity] duration-150 ease-out hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";
const secondaryButtonClassName =
  "h-14 w-full rounded-full border border-[#D0D5DD] bg-white px-6 text-sm font-semibold leading-5 text-[rgba(23,11,0,0.9)] shadow-none transition-transform duration-150 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 sm:w-auto sm:px-8";

function StepSection({ children }: { children: ReactNode }) {
  return <section className="space-y-4">{children}</section>;
}

function OptionalField({
  htmlFor,
  label,
  children,
}: {
  htmlFor: string;
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-sm text-v3-text-weak">
        {label}
      </Label>
      {children}
    </div>
  );
}

function ErrorText({ children }: { children: ReactNode }) {
  return <p className="text-sm text-text-error-strong">{children}</p>;
}

function FooterDivider() {
  return <div className="w-full border-t border-[rgba(23,11,0,0.1)]" />;
}

export default function MiscPage() {
  const { user, setUser } = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRevisitMode = searchParams.get("mode") === "revisit";
  const nickname = (user?.nickname as string) || "there";
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [prefill, setPrefill] = useState<
    Partial<import("./useOnboardQuestionsState").OnboardQuestionsState> | null
  >(isRevisitMode ? null : undefined);

  const {
    state,
    nextStep,
    prevStep,
    goToDeepPhase,
    canAdvance,
    setMotivationChips,
    setMotivationDetail,
    setAgeBand,
    setLifeSituations,
    setLifeSituationDetail,
    setHomePlace,
    setPersonalityTraits,
    setPersonalityDetail,
    setMemoryTreasures,
    setMemoryTreasuresDetail,
    setPassions,
    setPassionsDetail,
    setChronotype,
    setSharingIntent,
    setPriorityDimensions,
    setDimensionsDetail,
  } = useOnboardQuestionsState(prefill ?? undefined);

  const { trigger: completeOnboarding, isMutating } = useFetcher(endpoint.completeOnboarding);

  const step = state.step;
  const canProceed = canAdvance(step);
  const contentRef = useRef<HTMLDivElement>(null);
  const dots = progressDots(step);

  useEffect(() => {
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  useEffect(() => {
    if (user && isEmpty(user?.nickname)) {
      navigate("/onboarding/nickname");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!isRevisitMode) return;

    let cancelled = false;
    fetchOnboardingDetails().then((data) => {
      if (cancelled) return;
      setPrefill(data ? mapOnboardingDetailsToMiscState(data) : {});
    });

    return () => {
      cancelled = true;
    };
  }, [isRevisitMode]);

  const completeAndNavigate = useCallback(
    async (action: PostOnboardingAction, opts?: { skippedDeep?: boolean }) => {
      const skipped = opts?.skippedDeep ?? state.skippedDeepPersonalization;
      const motivationApi = motivationForApi(state.motivationChips);
      const primaryLifeSituation = primaryLifeSituationForApi(state.lifeSituations);
      const joinExtras = [
        ...state.motivationChips.filter(
          (chip): chip is MotivationType => chip !== "something_else",
        ),
        ...state.passions,
        ...(state.passionsDetail.trim() ? [state.passionsDetail.trim()] : []),
        ...state.memoryTreasures,
        ...state.personalityTraits.filter((p) => p !== "something_else"),
        ...(state.personalityTraits.includes("something_else") &&
        state.personalityDetail.trim()
          ? [state.personalityDetail.trim()]
          : []),
      ];
      const selfDescription = [
        state.personalityTraits.join(", "),
        state.homePlace.trim().slice(0, 240),
      ]
        .filter(Boolean)
        .join(" · ");

      try {
        await completeOnboarding({
          fullName: nickname,
          displayName: nickname,
          ageBand: state.ageBand ?? "",
          whereFrom: state.homePlace.trim() || undefined,
          mementoFor: [],
          passions: state.passions,
          passionsFreetext: state.passionsDetail.trim() || undefined,
          lifeContext: [],
          motivationType: motivationApi,
          priorityDimensions: state.priorityDimensions,
          dimensionsFreetext: state.dimensionsDetail.trim() || undefined,
          expressionMode: [],
          isComplete: true,
          stepReached: skipped ? 6 : 12,
          lifeSituation: primaryLifeSituation ?? undefined,
          lifeSituationDetail: state.lifeSituationDetail.trim() || undefined,
          personalityTraits: state.personalityTraits,
          memoryTreasures: state.memoryTreasures,
          chronotype: skipped ? undefined : state.chronotype ?? undefined,
          sharingIntent: skipped ? undefined : state.sharingIntent ?? undefined,
          motivationDetail:
            state.motivationChips.includes("something_else")
              ? state.motivationDetail.trim() || undefined
              : undefined,
          skippedDeepPersonalization: skipped,
        });
        await completeOnboarding({
          dob: "",
          join_reasons: joinExtras,
          self_description: selfDescription || state.passions.join(", "),
          current_priority: state.priorityDimensions.join(", ") || "",
        });
        await mutate(endpoint.profile);
        if (user && setUser) {
          setUser({ ...user, onboarded: true, onboarding_status: "completed" });
        }
      } catch {
        if (user && setUser) {
          setUser({ ...user, onboarded: true, onboarding_status: "completed" });
        }
      }

      saveOnboardingSummarySnapshot({
        nextAction: action,
        skippedDeepPersonalization: skipped,
        touchedCategories: deriveTouchedCategoriesFromMiscState(state),
        priorityDimensions: state.priorityDimensions,
        motivationType: motivationApi,
        nickname,
        motivationDetail: state.motivationDetail.trim() || undefined,
        lifeSituation: primaryLifeSituation,
        lifeSituationDetail: state.lifeSituationDetail.trim() || undefined,
        homePlace: state.homePlace.trim() || undefined,
        personalityTraits: state.personalityTraits,
        personalityDetail: state.personalityDetail.trim() || undefined,
        memoryTreasures: state.memoryTreasures,
        sharingIntent: skipped ? undefined : state.sharingIntent,
      });

      navigate("/onboarding/summary");
    },
    [nickname, state, completeOnboarding, navigate, user, setUser],
  );

  if (prefill === null) {
    return (
      <div className="flex min-h-full items-start justify-center pb-4 sm:pb-6 lg:pb-8">
        <div className="w-fit max-w-[664px] rounded-[24px] bg-white p-10">
          <div className="flex min-h-[40vh] items-center justify-center font-inter text-sm text-v3-text-weak">
            Loading your story…
          </div>
        </div>
      </div>
    );
  }

  const handleContinue = () => {
    if (step === 6) return;
    setValidationAttempted(true);
    if (!canProceed && step !== 12) return;
    setValidationAttempted(false);

    if (step === 12) {
      const motivationApi = motivationForApi(state.motivationChips);
      const { action } = getPrimaryCTA(motivationApi, []);
      void completeAndNavigate(action);
    } else {
      nextStep();
    }
  };

  const appendHomeSuggestion = (label: string) => {
    setHomePlace(label);
  };

  const togglePersonality = (v: PersonalityTraitKey) => {
    if (state.personalityTraits.includes(v)) {
      setPersonalityTraits(state.personalityTraits.filter((p) => p !== v));
    } else if (state.personalityTraits.length < MAX_PERSONALITY_TRAITS) {
      setPersonalityTraits([...state.personalityTraits, v]);
    }
  };

  const toggleMemory = (v: MemoryTreasureKey) => {
    if (state.memoryTreasures.includes(v)) {
      setMemoryTreasures(state.memoryTreasures.filter((m) => m !== v));
    } else if (state.memoryTreasures.length < MAX_MEMORY_TREASURES) {
      setMemoryTreasures([...state.memoryTreasures, v]);
    }
  };

  const togglePassion = (v: PassionKey) => {
    if (state.passions.includes(v)) {
      setPassions(state.passions.filter((p) => p !== v));
    } else if (state.passions.length < MAX_PASSIONS_MISC) {
      setPassions([...state.passions, v]);
    }
  };

  const toggleFocus = (v: (typeof ONBOARDING_FOCUS_FIRST_OPTIONS)[0]["value"]) => {
    if (state.priorityDimensions.includes(v)) {
      setPriorityDimensions(state.priorityDimensions.filter((d) => d !== v));
    } else if (state.priorityDimensions.length < MAX_FOCUS_FIRST) {
      setPriorityDimensions([...state.priorityDimensions, v]);
    }
  };

  const showIntro = step === 1;
  const motivationApi = motivationForApi(state.motivationChips);

  const whyFor = (s: keyof typeof ONBOARD_MISC_WHY) => ONBOARD_MISC_WHY[s];

  return (
    <div className="flex min-h-full items-start justify-center pb-4 sm:pb-6 lg:pb-8">
      <div className="w-fit max-w-[664px] rounded-[24px] bg-white p-10">
        <div ref={contentRef} className="flex flex-col gap-6">
          <div className="flex shrink-0 flex-col gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2" aria-hidden>
              {Array.from({ length: TOTAL_QUESTION_DOTS }, (_, i) => {
                const n = i + 1;
                const isCompleted = dots.completed(n);
                const isCurrent = dots.current(n);
                return (
                  <span
                    key={n}
                    className={cn(
                      "h-2.5 w-2.5 rounded-full transition-colors duration-150 ease-out",
                      (isCompleted || isCurrent) && "bg-fill-brand-strong",
                      !isCompleted && !isCurrent && "bg-v3-stroke-weak",
                    )}
                  />
                );
              })}
            </div>
            <p className="text-center font-inter text-sm leading-6 text-[rgba(23,11,0,0.72)]">
              {ONBOARD_QUESTIONS_STEP_LABELS[step]}
            </p>
          </div>

          {showIntro && (
            <div className="flex flex-col gap-2">
              <h3 className="font-garamond text-[22px] font-normal leading-[1.25] text-[rgba(23,11,0,0.9)] sm:text-[24px]">
                Okay, <span className="capitalize">{nickname}</span>. I&apos;ve got some questions for you.
              </h3>
              <p className="font-inter text-base font-normal leading-6 text-[rgba(23,11,0,0.9)]">
                These questions will help Memento better personalize your experience on the product.
              </p>
            </div>
          )}

          {step === 1 && (
            <StepSection>
              <OnboardQuestionHeader
                title={<>What brings you to Memento?</>}
                required
                whyDetail={whyFor(1).detail}
              />
              {validationAttempted && !canAdvance(1) && (
                <ErrorText>
                  Please choose one or more options, and add a note if you pick Something else.
                </ErrorText>
              )}
              <div className="flex flex-wrap gap-2">
                {MISC_MOTIVATION_OPTIONS.map((opt) => (
                  <OnboardSelectionCard
                    key={opt.value}
                    value={opt.value}
                    label={opt.label}
                    icon={opt.icon}
                    isSelected={state.motivationChips.includes(opt.value)}
                    onClick={() => {
                      const value = opt.value as MiscMotivationChip;
                      setMotivationChips(
                        state.motivationChips.includes(value)
                          ? state.motivationChips.filter((chip) => chip !== value)
                          : [...state.motivationChips, value],
                      );
                    }}
                  />
                ))}
              </div>
              {state.motivationChips.includes("something_else") && (
                <OptionalField htmlFor="motivation-other" label="In your own words">
                  <Textarea
                    id="motivation-other"
                    value={state.motivationDetail}
                    onChange={(e) => setMotivationDetail(e.target.value)}
                    placeholder="Tell us in a sentence or two"
                    maxLength={400}
                    className={cn("min-h-[96px]", fieldClassName)}
                  />
                </OptionalField>
              )}
            </StepSection>
          )}

          {step === 2 && (
            <StepSection>
              <OnboardQuestionHeader
                title={<>A little about you: how old are you?</>}
                required
                whyDetail={whyFor(2).detail}
              />
              {validationAttempted && !state.ageBand && (
                <ErrorText>Please pick an age range.</ErrorText>
              )}
              <div className="flex flex-wrap gap-2">
                {AGE_BAND_OPTIONS.map((opt) => (
                  <OnboardSelectionCard
                    key={opt.value}
                    value={opt.value}
                    label={opt.label}
                    icon={opt.icon}
                    isSelected={state.ageBand === opt.value}
                    onClick={() => setAgeBand(opt.value)}
                  />
                ))}
              </div>
            </StepSection>
          )}

          {step === 3 && (
            <StepSection>
              <OnboardQuestionHeader
                title={<>What do you do?</>}
                required
                whyDetail={whyFor(3).detail}
              />
              {validationAttempted && !canAdvance(3) && (
                <ErrorText>
                  Please choose one or more options, and add a note if you pick Something else.
                </ErrorText>
              )}
              <div className="flex flex-wrap gap-2">
                {LIFE_SITUATION_OPTIONS.map((opt) => (
                  <OnboardSelectionCard
                    key={opt.value}
                    value={opt.value}
                    label={opt.label}
                    icon={opt.icon}
                    isSelected={state.lifeSituations.includes(opt.value)}
                    onClick={() =>
                      setLifeSituations(
                        state.lifeSituations.includes(opt.value)
                          ? state.lifeSituations.filter((value) => value !== opt.value)
                          : [...state.lifeSituations, opt.value],
                      )
                    }
                    variant={opt.value === "something_else" ? "add" : undefined}
                  />
                ))}
              </div>
              {state.lifeSituations.includes("something_else") && (
                <OptionalField htmlFor="work-other" label="Something else">
                  <Textarea
                    id="work-other"
                    value={state.lifeSituationDetail}
                    onChange={(e) => setLifeSituationDetail(e.target.value)}
                    maxLength={200}
                    className={cn("min-h-[96px]", fieldClassName)}
                    placeholder="Briefly describe what you do"
                  />
                </OptionalField>
              )}
            </StepSection>
          )}

          {step === 4 && (
            <StepSection>
              <OnboardQuestionHeader
                title={
                  <>Is there a specific place in the world that feels most like home to you?</>
                }
                required
                whyDetail={whyFor(4).detail}
              />
              {validationAttempted && !state.homePlace.trim() && (
                <ErrorText>Please add a few words—there&apos;s no wrong answer.</ErrorText>
              )}
              <Textarea
                value={state.homePlace}
                onChange={(e) => setHomePlace(e.target.value)}
                placeholder="Places, people, a feeling—whatever home means to you"
                maxLength={500}
                className={cn("min-h-[112px]", fieldClassName)}
              />
              <p className="text-xs font-medium uppercase tracking-wide text-v3-text-weaker">
                Quick prompts
              </p>
              <div className="flex flex-wrap gap-2">
                {HOME_PLACE_SUGGESTION_OPTIONS.map((opt) => (
                  <OnboardSelectionCard
                    key={opt.value}
                    value={opt.value}
                    label={opt.label}
                    icon={opt.icon}
                    isSelected={false}
                    onClick={() => appendHomeSuggestion(opt.label)}
                  />
                ))}
              </div>
            </StepSection>
          )}

          {step === 5 && (
            <StepSection>
              <OnboardQuestionHeader
                title={<>How would the people closest to you describe you?</>}
                required
                whyDetail={whyFor(5).detail}
              />
              <p className="text-sm text-v3-text-weak">
                Pick up to {MAX_PERSONALITY_TRAITS}
                {validationAttempted && !canAdvance(5) && (
                  <span className="ml-2 text-text-error-strong">Choose at least one.</span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {PERSONALITY_TRAIT_OPTIONS.map((opt) => (
                  <OnboardSelectionCard
                    key={opt.value}
                    value={opt.value}
                    label={opt.label}
                    icon={opt.icon}
                    isSelected={state.personalityTraits.includes(opt.value)}
                    onClick={() => togglePersonality(opt.value)}
                    variant={opt.value === "something_else" ? "add" : undefined}
                  />
                ))}
              </div>
              {state.personalityTraits.includes("something_else") && (
                <OptionalField htmlFor="personality-other" label="Something else">
                  <Textarea
                    id="personality-other"
                    value={state.personalityDetail}
                    onChange={(e) => setPersonalityDetail(e.target.value)}
                    maxLength={200}
                    className={cn("min-h-[96px]", fieldClassName)}
                  />
                </OptionalField>
              )}
            </StepSection>
          )}

          {step === 6 && (
            <div className="flex flex-col gap-6">
              <h3 className="font-garamond text-xl font-normal text-v3-text-strong sm:text-2xl">
                You&apos;re off to a great start
              </h3>
              <p className="font-inter text-base leading-6 text-[rgba(23,11,0,0.72)]">
                You can wrap up now and head into Memento, or spend another minute so we can personalize your space a
                little more.
              </p>
            </div>
          )}

          {step === 7 && (
            <StepSection>
              <OnboardQuestionHeader
                title={<>What kind of moments do you treasure most?</>}
                required
                whyDetail={whyFor(7).detail}
              />
              <p className="text-sm text-v3-text-weak">Pick up to {MAX_MEMORY_TREASURES}</p>
              {validationAttempted && state.memoryTreasures.length < 1 && (
                <ErrorText>Pick at least one.</ErrorText>
              )}
              <div className="flex flex-wrap gap-2">
                {MEMORY_TREASURE_OPTIONS.map((opt) => (
                  <OnboardSelectionCard
                    key={opt.value}
                    value={opt.value}
                    label={opt.label}
                    icon={opt.icon}
                    isSelected={state.memoryTreasures.includes(opt.value)}
                    onClick={() => toggleMemory(opt.value)}
                  />
                ))}
              </div>
              <OptionalField
                htmlFor="memory-extra"
                label={
                  <>
                    Anything else? <span className="font-normal">(optional)</span>
                  </>
                }
              >
                <Textarea
                  id="memory-extra"
                  value={state.memoryTreasuresDetail}
                  onChange={(e) => setMemoryTreasuresDetail(e.target.value)}
                  maxLength={300}
                  className={cn("min-h-[96px]", fieldClassName)}
                  placeholder="A moment only you would think to mention"
                />
              </OptionalField>
            </StepSection>
          )}

          {step === 8 && (
            <StepSection>
              <OnboardQuestionHeader
                title={<>What pulls you in outside of work?</>}
                required
                whyDetail={whyFor(8).detail}
              />
              <p className="text-sm text-v3-text-weak">Pick up to {MAX_PASSIONS_MISC}</p>
              {validationAttempted && state.passions.length < 1 && (
                <ErrorText>Pick at least one.</ErrorText>
              )}
              <div className="flex flex-wrap gap-2">
                {MISC_PASSION_OPTIONS.map((opt) => (
                  <OnboardSelectionCard
                    key={opt.value}
                    value={opt.value}
                    label={opt.label}
                    icon={opt.icon || undefined}
                    isSelected={state.passions.includes(opt.value)}
                    onClick={() => togglePassion(opt.value)}
                  />
                ))}
              </div>
              <OptionalField
                htmlFor="passion-extra"
                label={
                  <>
                    Add your own <span className="font-normal">(optional)</span>
                  </>
                }
              >
                <Textarea
                  id="passion-extra"
                  value={state.passionsDetail}
                  onChange={(e) => setPassionsDetail(e.target.value)}
                  maxLength={200}
                  className={cn("min-h-[96px]", fieldClassName)}
                  placeholder="e.g. chess, local history…"
                />
              </OptionalField>
            </StepSection>
          )}

          {step === 9 && (
            <StepSection>
              <OnboardQuestionHeader
                title={<>Are you a morning person or a night owl?</>}
                required
                whyDetail={whyFor(9).detail}
              />
              {validationAttempted && !state.chronotype && (
                <ErrorText>Please pick one.</ErrorText>
              )}
              <div className="flex flex-wrap gap-2">
                {CHRONOTYPE_OPTIONS.map((opt) => (
                  <OnboardSelectionCard
                    key={opt.value}
                    value={opt.value}
                    label={opt.label}
                    icon={opt.icon}
                    isSelected={state.chronotype === opt.value}
                    onClick={() => setChronotype(opt.value)}
                  />
                ))}
              </div>
            </StepSection>
          )}

          {step === 10 && (
            <StepSection>
              <OnboardQuestionHeader
                title={<>Memento can be a private vault or a shared legacy. Which sounds most like you today?</>}
                required
                whyDetail={whyFor(10).detail}
              />
              {validationAttempted && !state.sharingIntent && (
                <ErrorText>Please pick one.</ErrorText>
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {SHARING_INTENT_OPTIONS.map((opt) => (
                  <OnboardSelectionCard
                    key={opt.value}
                    value={opt.value}
                    label={opt.label}
                    icon={opt.icon}
                    isSelected={state.sharingIntent === opt.value}
                    onClick={() => setSharingIntent(opt.value)}
                  />
                ))}
              </div>
            </StepSection>
          )}

          {step === 11 && (
            <StepSection>
              <OnboardQuestionHeader
                title={<>Where should Memento focus first?</>}
                required
                whyDetail={whyFor(11).detail}
              />
              <p className="text-sm text-v3-text-weak">Pick up to {MAX_FOCUS_FIRST}</p>
              {validationAttempted && state.priorityDimensions.length < 1 && (
                <ErrorText>Pick at least one.</ErrorText>
              )}
              <div className="flex flex-wrap gap-2">
                {ONBOARDING_FOCUS_FIRST_OPTIONS.map((opt) => (
                  <OnboardSelectionCard
                    key={opt.value}
                    value={opt.value}
                    label={opt.label}
                    icon={opt.icon}
                    isSelected={state.priorityDimensions.includes(opt.value)}
                    onClick={() => toggleFocus(opt.value)}
                  />
                ))}
              </div>
              <OptionalField
                htmlFor="focus-extra"
                label={
                  <>
                    Something else <span className="font-normal">(optional)</span>
                  </>
                }
              >
                <Input
                  id="focus-extra"
                  value={state.dimensionsDetail}
                  onChange={(e) => setDimensionsDetail(e.target.value)}
                  maxLength={200}
                  className={fieldClassName}
                />
              </OptionalField>
            </StepSection>
          )}

          {step === 12 && (
            <div className="flex flex-col items-center gap-5 text-center">
              <h1 className="font-garamond text-2xl font-normal leading-tight text-v3-text-strong sm:text-[28px]">
                You&apos;re all set, <span className="capitalize">{nickname}</span>. Let&apos;s begin.
              </h1>
              <p className="max-w-md font-inter text-base leading-6 text-[rgba(23,11,0,0.72)]">
                {getStep5Body(motivationApi, {
                  partialPersonalization: state.skippedDeepPersonalization,
                })}
              </p>
              <button
                type="button"
                onClick={() => void completeAndNavigate("dashboard")}
                className="text-sm text-v3-text-weaker transition-colors duration-150 ease-out hover:text-v3-text-weak"
              >
                Or take me to the dashboard — I&apos;ll explore on my own →
              </button>
            </div>
          )}

          {step !== 6 && (
            <>
              <FooterDivider />
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={prevStep}
              disabled={step === 1 || isMutating}
              className={secondaryButtonClassName}
            >
              Prev
            </Button>
            <Button
              type="button"
              onClick={() => void handleContinue()}
              disabled={(step < 12 && !canProceed) || isMutating}
              className={primaryButtonClassName}
            >
              {step === 12 ? getPrimaryCTA(motivationApi, []).label : "Continue"}
            </Button>
              </div>
            </>
          )}

          {step === 6 && (
            <div className="space-y-6 pt-6">
              <FooterDivider />
              <div className="flex flex-col gap-3 sm:items-end">
                <div className="flex flex-col gap-3 sm:w-full sm:max-w-[420px] sm:flex-row sm:justify-end sm:gap-4">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isMutating}
                    className={cn(secondaryButtonClassName, "sm:flex-1")}
                    onClick={() => {
                      void completeAndNavigate("dashboard", { skippedDeep: true });
                    }}
                  >
                    Continue later
                  </Button>
                  <Button
                    type="button"
                    disabled={isMutating}
                    className={cn(primaryButtonClassName, "sm:flex-1")}
                    onClick={() => {
                      goToDeepPhase();
                    }}
                  >
                    Keep going
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

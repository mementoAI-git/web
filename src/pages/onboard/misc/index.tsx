"use client";

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

function motivationForApi(
  chip: MiscMotivationChip | null,
): MotivationType {
  if (!chip || chip === "something_else") return "explorer";
  return chip as MotivationType;
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
    setMotivationChip,
    setMotivationDetail,
    setAgeBand,
    setLifeSituation,
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
      navigate("/onboard/nickname");
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
      const motivationApi = motivationForApi(state.motivationChip);
      const joinExtras = [
        motivationApi,
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
          lifeSituation: state.lifeSituation ?? undefined,
          lifeSituationDetail: state.lifeSituationDetail.trim() || undefined,
          personalityTraits: state.personalityTraits,
          memoryTreasures: state.memoryTreasures,
          chronotype: skipped ? undefined : state.chronotype ?? undefined,
          sharingIntent: skipped ? undefined : state.sharingIntent ?? undefined,
          motivationDetail:
            state.motivationChip === "something_else"
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
        lifeSituation: state.lifeSituation,
        lifeSituationDetail: state.lifeSituationDetail.trim() || undefined,
        homePlace: state.homePlace.trim() || undefined,
        personalityTraits: state.personalityTraits,
        personalityDetail: state.personalityDetail.trim() || undefined,
        memoryTreasures: state.memoryTreasures,
        sharingIntent: skipped ? undefined : state.sharingIntent,
      });

      navigate("/onboard/summary");
    },
    [nickname, state, completeOnboarding, navigate, user, setUser],
  );

  if (prefill === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center font-inter text-sm text-v3-text-weak">
        Loading your story…
      </div>
    );
  }

  const handleContinue = () => {
    if (step === 6) return;
    setValidationAttempted(true);
    if (!canProceed && step !== 12) return;
    setValidationAttempted(false);

    if (step === 12) {
      const motivationApi = motivationForApi(state.motivationChip);
      const { action } = getPrimaryCTA(motivationApi, []);
      void completeAndNavigate(action);
    } else {
      nextStep();
    }
  };

  const appendHomeSuggestion = (label: string) => {
    const t = state.homePlace.trim();
    setHomePlace(t ? `${t}; ${label}` : label);
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
  const motivationApi = motivationForApi(state.motivationChip);

  const whyFor = (s: keyof typeof ONBOARD_MISC_WHY) => ONBOARD_MISC_WHY[s];

  return (
    <div ref={contentRef} className="flex w-full flex-col gap-10">
      <div className="flex shrink-0 flex-col items-center gap-3">
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
        <p className="text-sm text-v3-text-weak">{ONBOARD_QUESTIONS_STEP_LABELS[step]}</p>
      </div>

      {showIntro && (
        <div className="flex flex-col gap-1">
          <h3 className="font-garamond text-[24px] font-normal leading-[38px] text-v3-text-strong">
            Okay, <span className="capitalize">{nickname}</span>. I&apos;ve got some questions for you.
          </h3>
          <p className="font-garamond text-[20px] font-normal leading-[28px] text-v3-text-strong">
            These questions will help Memento better personalize your experience on the product.
          </p>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <OnboardQuestionHeader
            title={<>What brings you to Memento?</>}
            required
            hint={whyFor(1).hint}
            whyDetail={whyFor(1).detail}
          />
          {validationAttempted && !canAdvance(1) && (
            <p className="text-sm text-text-error-strong">Please choose one option (and add a note if you pick Something else).</p>
          )}
          <div className="flex flex-wrap gap-2">
            {MISC_MOTIVATION_OPTIONS.map((opt) => (
              <OnboardSelectionCard
                key={opt.value}
                value={opt.value}
                label={opt.label}
                icon={opt.icon}
                isSelected={state.motivationChip === opt.value}
                onClick={() => setMotivationChip(opt.value as MiscMotivationChip)}
              />
            ))}
          </div>
          {state.motivationChip === "something_else" && (
            <div className="space-y-2">
              <Label htmlFor="motivation-other" className="text-sm text-v3-text-weak">
                In your own words
              </Label>
              <Textarea
                id="motivation-other"
                value={state.motivationDetail}
                onChange={(e) => setMotivationDetail(e.target.value)}
                placeholder="Tell us in a sentence or two"
                maxLength={400}
                className="min-h-[88px] border-v3-stroke-weak bg-v3-fill-weaker text-v3-text-strong placeholder:text-v3-text-weaker focus-visible:border-v3-brand-strong focus-visible:ring-v3-brand-strong/30"
              />
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <OnboardQuestionHeader
            title={<>A little about you: how old are you?</>}
            required
            hint={whyFor(2).hint}
            whyDetail={whyFor(2).detail}
          />
          {validationAttempted && !state.ageBand && (
            <p className="text-sm text-text-error-strong">Please pick an age range.</p>
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
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <OnboardQuestionHeader
            title={<>What do you do?</>}
            required
            hint={whyFor(3).hint}
            whyDetail={whyFor(3).detail}
          />
          {validationAttempted && !canAdvance(3) && (
            <p className="text-sm text-text-error-strong">Please pick one (and add a note if you pick Something else).</p>
          )}
          <div className="flex flex-wrap gap-2">
            {LIFE_SITUATION_OPTIONS.map((opt) => (
              <OnboardSelectionCard
                key={opt.value}
                value={opt.value}
                label={opt.label}
                icon={opt.icon}
                isSelected={state.lifeSituation === opt.value}
                onClick={() => setLifeSituation(opt.value)}
                variant={opt.value === "something_else" ? "add" : undefined}
              />
            ))}
          </div>
          {state.lifeSituation === "something_else" && (
            <div className="space-y-2">
              <Label htmlFor="work-other" className="text-sm text-v3-text-weak">
                Something else
              </Label>
              <Input
                id="work-other"
                value={state.lifeSituationDetail}
                onChange={(e) => setLifeSituationDetail(e.target.value)}
                maxLength={200}
                className="border-v3-stroke-weak bg-v3-fill-weaker text-v3-text-strong placeholder:text-v3-text-weaker"
                placeholder="Briefly describe what you do"
              />
            </div>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <OnboardQuestionHeader
            title={
              <>Is there a specific place in the world that feels most like &quot;home&quot; to you?</>
            }
            required
            hint={whyFor(4).hint}
            whyDetail={whyFor(4).detail}
          />
          {validationAttempted && !state.homePlace.trim() && (
            <p className="text-sm text-text-error-strong">Please add a few words—there&apos;s no wrong answer.</p>
          )}
          <Textarea
            value={state.homePlace}
            onChange={(e) => setHomePlace(e.target.value)}
            placeholder="Places, people, a feeling—whatever home means to you"
            maxLength={500}
            className="min-h-[100px] border-v3-stroke-weak bg-v3-fill-weaker text-v3-text-strong placeholder:text-v3-text-weaker focus-visible:border-v3-brand-strong focus-visible:ring-v3-brand-strong/30"
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
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <OnboardQuestionHeader
            title={<>How would the people closest to you describe you?</>}
            required
            hint={whyFor(5).hint}
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
            <div className="space-y-2">
              <Label htmlFor="personality-other" className="text-sm text-v3-text-weak">
                Something else
              </Label>
              <Input
                id="personality-other"
                value={state.personalityDetail}
                onChange={(e) => setPersonalityDetail(e.target.value)}
                maxLength={200}
                className="border-v3-stroke-weak bg-v3-fill-weaker"
              />
            </div>
          )}
        </div>
      )}

      {step === 6 && (
        <div className="flex flex-col gap-6 text-center sm:text-left">
          <h3 className="font-garamond text-xl font-normal text-v3-text-strong sm:text-2xl">
            You&apos;re off to a great start
          </h3>
          <p className="font-garamond text-base leading-relaxed text-v3-text-weak">
            You can wrap up now and head into Memento, or spend another minute so we can personalize your space a
            little more.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Button
              type="button"
              variant="secondary"
              disabled={isMutating}
              className="rounded-full border-v3-stroke-weak bg-v3-fill-weaker px-6 py-6 text-v3-text-strong transition-transform duration-150 ease-out active:scale-[0.98] sm:flex-1"
              onClick={() => {
                void completeAndNavigate("dashboard", { skippedDeep: true });
              }}
            >
              Continue later
            </Button>
            <Button
              type="button"
              disabled={isMutating}
              className="rounded-full !bg-fill-brand-strong px-6 py-6 text-white transition-transform duration-150 ease-out active:scale-[0.98] hover:!bg-fill-brand-weak sm:flex-1"
              onClick={() => {
                goToDeepPhase();
              }}
            >
              Keep going to personalize my AI
            </Button>
          </div>
        </div>
      )}

      {step === 7 && (
        <div className="space-y-4">
          <OnboardQuestionHeader
            title={<>What kind of moments do you treasure most?</>}
            required
            hint={whyFor(7).hint}
            whyDetail={whyFor(7).detail}
          />
          <p className="text-sm text-v3-text-weak">Pick up to {MAX_MEMORY_TREASURES}</p>
          {validationAttempted && state.memoryTreasures.length < 1 && (
            <p className="text-sm text-text-error-strong">Pick at least one.</p>
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
          <div className="space-y-2">
            <Label htmlFor="memory-extra" className="text-sm text-v3-text-weak">
              Anything else? <span className="font-normal">(optional)</span>
            </Label>
            <Textarea
              id="memory-extra"
              value={state.memoryTreasuresDetail}
              onChange={(e) => setMemoryTreasuresDetail(e.target.value)}
              maxLength={300}
              className="min-h-[72px] border-v3-stroke-weak bg-v3-fill-weaker text-v3-text-strong"
              placeholder="A moment only you would think to mention"
            />
          </div>
        </div>
      )}

      {step === 8 && (
        <div className="space-y-4">
          <OnboardQuestionHeader
            title={<>What pulls you in outside of work?</>}
            required
            hint={whyFor(8).hint}
            whyDetail={whyFor(8).detail}
          />
          <p className="text-sm text-v3-text-weak">Pick up to {MAX_PASSIONS_MISC}</p>
          {validationAttempted && state.passions.length < 1 && (
            <p className="text-sm text-text-error-strong">Pick at least one.</p>
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
          <div className="space-y-2">
            <Label htmlFor="passion-extra" className="text-sm text-v3-text-weak">
              Add your own <span className="font-normal">(optional)</span>
            </Label>
            <Input
              id="passion-extra"
              value={state.passionsDetail}
              onChange={(e) => setPassionsDetail(e.target.value)}
              maxLength={200}
              className="border-v3-stroke-weak bg-v3-fill-weaker"
              placeholder="e.g. chess, local history…"
            />
          </div>
        </div>
      )}

      {step === 9 && (
        <div className="space-y-4">
          <OnboardQuestionHeader
            title={<>Are you a morning person or a night owl?</>}
            required
            hint={whyFor(9).hint}
            whyDetail={whyFor(9).detail}
          />
          {validationAttempted && !state.chronotype && (
            <p className="text-sm text-text-error-strong">Please pick one.</p>
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
        </div>
      )}

      {step === 10 && (
        <div className="space-y-4">
          <OnboardQuestionHeader
            title={<>Memento can be a private vault or a shared legacy. Which sounds most like you today?</>}
            required
            hint={whyFor(10).hint}
            whyDetail={whyFor(10).detail}
          />
          {validationAttempted && !state.sharingIntent && (
            <p className="text-sm text-text-error-strong">Please pick one.</p>
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
        </div>
      )}

      {step === 11 && (
        <div className="space-y-4">
          <OnboardQuestionHeader
            title={<>Where should Memento focus first?</>}
            required
            hint={whyFor(11).hint}
            whyDetail={whyFor(11).detail}
          />
          <p className="text-sm text-v3-text-weak">Pick up to {MAX_FOCUS_FIRST}</p>
          {validationAttempted && state.priorityDimensions.length < 1 && (
            <p className="text-sm text-text-error-strong">Pick at least one.</p>
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
          <div className="space-y-2">
            <Label htmlFor="focus-extra" className="text-sm text-v3-text-weak">
              Something else <span className="font-normal">(optional)</span>
            </Label>
            <Input
              id="focus-extra"
              value={state.dimensionsDetail}
              onChange={(e) => setDimensionsDetail(e.target.value)}
              maxLength={200}
              className="border-v3-stroke-weak bg-v3-fill-weaker"
            />
          </div>
        </div>
      )}

      {step === 12 && (
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="font-garamond text-2xl font-normal leading-tight text-v3-text-strong sm:text-[28px]">
            You&apos;re all set, <span className="capitalize">{nickname}</span>. Let&apos;s begin.
          </h1>
          <p className="max-w-md font-garamond text-base leading-relaxed text-v3-text-weak">
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
          <div className="w-full border-t border-v3-stroke-weak" />
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={prevStep}
              disabled={step === 1 || isMutating}
              className="h-fit rounded-full border-v3-stroke-weak !bg-transparent px-6 py-[14px] text-sm font-semibold leading-5 text-v3-text-strong transition-transform duration-150 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 sm:px-8"
            >
              Prev
            </Button>
            <Button
              type="button"
              onClick={() => void handleContinue()}
              disabled={(step < 12 && !canProceed) || isMutating}
              className="flex h-auto items-center gap-2 rounded-full !bg-fill-brand-strong px-6 py-3.5 text-sm font-semibold leading-5 text-white shadow-sm transition-transform duration-150 ease-out hover:!bg-fill-brand-weak active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:px-8 sm:py-[14px]"
            >
              {step === 12 ? getPrimaryCTA(motivationApi, []).label : "Continue"}
            </Button>
          </div>
        </>
      )}

      {step === 6 && (
        <div className="w-full border-t border-v3-stroke-weak pt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={prevStep}
            disabled={isMutating}
            className="rounded-full border-v3-stroke-weak !bg-transparent px-6 py-[14px] text-sm font-semibold text-v3-text-strong transition-transform duration-150 ease-out active:scale-[0.98]"
          >
            Prev
          </Button>
        </div>
      )}
    </div>
  );
}

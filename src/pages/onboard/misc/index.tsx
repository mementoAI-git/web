"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/hooks/use-store";
import { isEmpty } from "@/utility";
import {
  AGE_BAND_OPTIONS,
  MEMENTO_FOR_OPTIONS,
  PASSION_OPTIONS,
  LIFE_CONTEXT_OPTIONS,
  MOTIVATION_OPTIONS,
  DIMENSION_OPTIONS,
  EXPRESSION_OPTIONS,
} from "@/features/onboarding-groot/types";
import { getPrimaryCTA, getStep5Body } from "@/features/onboarding-groot/adaptive";
import type { LifeContextKey } from "@/features/onboarding-groot/types";
import { OnboardSelectionCard } from "./OnboardSelectionCard";
import { useOnboardQuestionsState, ONBOARD_QUESTIONS_STEP_LABELS } from "./useOnboardQuestionsState";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";
import { mutate } from "swr";
import { storageKeys } from "@/utility/constant";
import { saveOnboarding } from "@/api/onboarding";

const NONE_CONTEXT: LifeContextKey = "none_of_these";
const MAX_EXPRESSION = 2;
const ALL_EXPRESSION_MODES = EXPRESSION_OPTIONS.map((o) => o.value);

export default function MiscPage() {
  const { user } = useStore();
  const navigate = useNavigate();
  const nickname = (user?.nickname as string) || "there";
  const [validationAttempted, setValidationAttempted] = useState(false);

  const {
    state,
    nextStep,
    prevStep,
    canAdvance,
    setAgeBand,
    setWhereFrom,
    setMementoFor,
    setPassions,
    setPassionsFreetext,
    setLifeContext,
    setMotivationType,
    setPriorityDimensions,
    setExpressionMode,
  } = useOnboardQuestionsState();

  const { trigger: completeOnboarding, isMutating } = useFetcher(endpoint.completeOnboarding);

  const step = state.step;
  const canProceed = canAdvance(step);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  useEffect(() => {
    if (user && isEmpty(user?.nickname)) {
      navigate("/onboard/nickname");
    }
  }, [user, navigate]);

  const toggleMementoFor = (v: (typeof MEMENTO_FOR_OPTIONS)[0]["value"]) => {
    if (state.mementoFor.includes(v)) {
      setMementoFor(state.mementoFor.filter((m) => m !== v));
    } else {
      setMementoFor([...state.mementoFor, v]);
    }
  };

  const togglePassion = (v: (typeof PASSION_OPTIONS)[0]["value"]) => {
    if (state.passions.includes(v)) {
      setPassions(state.passions.filter((p) => p !== v));
    } else {
      setPassions([...state.passions, v]);
    }
  };

  const toggleLifeContext = (v: LifeContextKey) => {
    if (v === NONE_CONTEXT) {
      setLifeContext(state.lifeContext.includes(NONE_CONTEXT) ? [] : [NONE_CONTEXT]);
    } else {
      if (state.lifeContext.includes(v)) {
        setLifeContext(state.lifeContext.filter((c) => c !== v));
      } else {
        setLifeContext([...state.lifeContext.filter((c) => c !== NONE_CONTEXT), v]);
      }
    }
  };

  const toggleDimension = (v: (typeof DIMENSION_OPTIONS)[0]["value"]) => {
    if (state.priorityDimensions.includes(v)) {
      setPriorityDimensions(state.priorityDimensions.filter((d) => d !== v));
    } else {
      setPriorityDimensions([...state.priorityDimensions, v]);
    }
  };

  const allExpressionSelected = state.expressionMode.length === ALL_EXPRESSION_MODES.length;
  const toggleExpression = (v: (typeof EXPRESSION_OPTIONS)[0]["value"]) => {
    if (state.expressionMode.includes(v)) {
      setExpressionMode(state.expressionMode.filter((m) => m !== v));
    } else if (allExpressionSelected || state.expressionMode.length < MAX_EXPRESSION) {
      setExpressionMode([...state.expressionMode, v]);
    }
  };
  const handleAllExpression = () => {
    setExpressionMode(allExpressionSelected ? [] : [...ALL_EXPRESSION_MODES]);
  };

  const completeAndNavigate = useCallback(
    async (action: string) => {
      try {
        await saveOnboarding({
          fullName: nickname,
          displayName: nickname,
          ageBand: state.ageBand ?? "",
          whereFrom: state.whereFrom.trim() || undefined,
          mementoFor: state.mementoFor,
          passions: state.passions,
          passionsFreetext: state.passionsFreetext.trim() || undefined,
          lifeContext: state.lifeContext,
          motivationType: state.motivationType ?? "",
          priorityDimensions: state.priorityDimensions,
          expressionMode: state.expressionMode,
          isComplete: true,
          stepReached: 8,
        });
        await completeOnboarding({
          dob: "",
          join_reasons: state.motivationType ? [state.motivationType] : [],
          self_description: state.passions.join(", ") || state.passionsFreetext,
          current_priority: state.priorityDimensions.join(", ") || "",
        });
        await mutate(endpoint.profile);
        localStorage.setItem(storageKeys.onboardingComplete, "true");
      } catch {
        localStorage.setItem(storageKeys.onboardingComplete, "true");
      }

      switch (action) {
        case "voice_recorder":
          navigate("/overview", { state: { openModal: "create-memory" } });
          break;
        case "reflection_prompt":
          navigate("/explore");
          break;
        case "file_upload":
          navigate("/overview", { state: { openModal: "create-memory" } });
          break;
        case "time_capsule":
          navigate("/capsule");
          break;
        default:
          navigate("/overview");
      }
    },
    [
      nickname,
      state,
      completeOnboarding,
      navigate,
    ]
  );

  const handleContinue = () => {
    setValidationAttempted(true);
    if (!canProceed && step !== 8) return;
    setValidationAttempted(false);

    if (step === 8) {
      const { action } = getPrimaryCTA(state.motivationType, state.expressionMode);
      completeAndNavigate(action);
    } else {
      nextStep();
    }
  };

  const showIntro = step === 1;
  const TOTAL_STEPS = 8;

  return (
    <div ref={contentRef} className="flex flex-col gap-6 sm:gap-8">
      {/* Step dots and label - matches image design */}
      <div className="flex shrink-0 flex-col items-center gap-3">
        <div className="flex items-center gap-2" aria-hidden>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => {
            const stepNum = i + 1;
            const isCompleted = stepNum < step;
            const isCurrent = stepNum === step;
            return (
              <span
                key={stepNum}
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-colors",
                  (isCompleted || isCurrent) && "bg-[#E26A24]",
                  !isCompleted && !isCurrent && "bg-[#E4D9CC]"
                )}
              />
            );
          })}
        </div>
        <p className="text-sm text-[#7A6A5E]">{ONBOARD_QUESTIONS_STEP_LABELS[step]}</p>
      </div>

      {showIntro && (
        <div className="flex flex-col gap-3 sm:gap-4">
          <h3 className="font-garamond text-2xl sm:text-[28px] md:text-[32px] font-medium leading-[32px] sm:leading-[36px] md:leading-[38px] text-[#4A4A4A]">
            Okay, <span className="capitalize">{nickname}</span>. I&apos;ve got some questions for you.
          </h3>
          <p className="font-garamond text-base sm:text-xl md:text-2xl font-normal leading-[24px] sm:leading-[26px] md:leading-[28px] text-[#4A4A4A]/80">
            These questions will help Memento better personalize your experience on the product.
          </p>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-4">
            <p className="font-garamond text-lg sm:text-xl font-medium text-[#4A4A4A]">
              How old are you?<span className="text-[#4A90E2]">*</span>
            </p>
            {validationAttempted && !state.ageBand && (
              <p className="text-sm text-[#C55A1D]">Please pick an age range.</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <div className="space-y-2">
            <label htmlFor="where-from" className="block font-garamond text-lg sm:text-xl font-medium text-[#4A4A4A]">
              Where are you from? <span className="text-[#4A4A4A]/60">(optional)</span>
            </label>
            <input
              id="where-from"
              type="text"
              value={state.whereFrom}
              onChange={(e) => setWhereFrom(e.target.value)}
              placeholder="City, country — or just the region"
              maxLength={120}
              className="w-full rounded-xl border-[1.5px] border-[#E4D9CC] bg-[#FFFCF8] px-4 py-3 text-[#2C1F15] placeholder:text-[#B0A098] focus:border-[#C8956C] focus:outline-none"
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="font-garamond text-lg sm:text-xl font-medium text-[#4A4A4A]">
            Who is this Memento mostly for?<span className="text-[#4A90E2]">*</span>{" "}
            <span className="text-[#B87333] text-base">(multi-select)</span>
          </p>
          {validationAttempted && state.mementoFor.length < 1 && (
            <p className="text-sm text-[#C55A1D]">Please pick at least one.</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MEMENTO_FOR_OPTIONS.map((opt) => (
              <OnboardSelectionCard
                key={opt.value}
                value={opt.value}
                label={opt.label}
                icon={opt.icon}
                isSelected={state.mementoFor.includes(opt.value)}
                onClick={() => toggleMementoFor(opt.value)}
              />
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="font-garamond text-lg sm:text-xl font-medium text-[#4A4A4A]">
            What are some things you&apos;re passionate about?<span className="text-[#4A90E2]">*</span>{" "}
            <span className="text-[#B87333] text-base">(multi-select)</span>
          </p>
          {validationAttempted && state.passions.length < 1 && (
            <p className="text-sm text-[#C55A1D]">Pick at least one.</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PASSION_OPTIONS.map((opt) => (
              <OnboardSelectionCard
                key={opt.value}
                value={opt.value}
                label={opt.label}
                icon={opt.icon}
                isSelected={state.passions.includes(opt.value)}
                onClick={() => togglePassion(opt.value)}
              />
            ))}
          </div>
          {state.passions.includes("something_else") && (
            <input
              type="text"
              value={state.passionsFreetext}
              onChange={(e) => setPassionsFreetext(e.target.value)}
              placeholder="e.g. gardening, vintage cars..."
              maxLength={200}
              className="mt-2 w-full rounded-xl border-[1.5px] border-[#E4D9CC] bg-[#FFFCF8] px-4 py-3 text-[#2C1F15] placeholder:text-[#B0A098] focus:border-[#C8956C] focus:outline-none"
            />
          )}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <p className="font-garamond text-lg sm:text-xl font-medium text-[#4A4A4A]">
            Which of these feel true for you today?<span className="text-[#4A90E2]">*</span>{" "}
            <span className="text-[#B87333] text-base">(multi-select)</span>
          </p>
          {validationAttempted && state.lifeContext.length < 1 && (
            <p className="text-sm text-[#C55A1D]">Please pick at least one.</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LIFE_CONTEXT_OPTIONS.map((opt) => (
              <OnboardSelectionCard
                key={opt.value}
                value={opt.value}
                label={opt.label}
                icon={opt.icon}
                isSelected={state.lifeContext.includes(opt.value)}
                onClick={() => toggleLifeContext(opt.value)}
              />
            ))}
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <p className="font-garamond text-lg sm:text-xl font-medium text-[#4A4A4A]">
            What brings you to Memento?<span className="text-[#4A90E2]">*</span>
          </p>
          {validationAttempted && !state.motivationType && (
            <p className="text-sm text-[#C55A1D]">Please choose one.</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MOTIVATION_OPTIONS.map((opt) => (
              <OnboardSelectionCard
                key={opt.value}
                value={opt.value}
                label={opt.label}
                icon={opt.icon}
                isSelected={state.motivationType === opt.value}
                onClick={() => setMotivationType(opt.value)}
              />
            ))}
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-4">
          <p className="font-garamond text-lg sm:text-xl font-medium text-[#4A4A4A]">
            What matters most to you now?<span className="text-[#4A90E2]">*</span>{" "}
            <span className="text-[#B87333] text-base">(multi-select)</span>
          </p>
          {validationAttempted && state.priorityDimensions.length < 1 && (
            <p className="text-sm text-[#C55A1D]">Pick at least one.</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DIMENSION_OPTIONS.map((opt) => (
              <OnboardSelectionCard
                key={opt.value}
                value={opt.value}
                label={opt.label}
                icon={opt.icon}
                isSelected={state.priorityDimensions.includes(opt.value)}
                onClick={() => toggleDimension(opt.value)}
              />
            ))}
          </div>
        </div>
      )}

      {step === 7 && (
        <div className="space-y-4">
          <p className="font-garamond text-lg sm:text-xl font-medium text-[#4A4A4A]">
            How would you most like to add to your Memento?<span className="text-[#4A90E2]">*</span>{" "}
            <span className="text-[#B87333] text-base">(pick up to 2)</span>
          </p>
          {validationAttempted && state.expressionMode.length < 1 && (
            <p className="text-sm text-[#C55A1D]">Pick at least one.</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EXPRESSION_OPTIONS.map((opt) => (
              <OnboardSelectionCard
                key={opt.value}
                value={opt.value}
                label={opt.label}
                icon={opt.icon}
                isSelected={state.expressionMode.includes(opt.value)}
                onClick={() => toggleExpression(opt.value)}
              />
            ))}
            <OnboardSelectionCard
              value="__all__"
              label="All of the above"
              icon="✨"
              isSelected={allExpressionSelected}
              onClick={handleAllExpression}
            />
          </div>
        </div>
      )}

      {step === 8 && (
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="font-garamond text-2xl sm:text-[28px] font-medium leading-tight text-[#4A4A4A]">
            You&apos;re all set, <span className="capitalize">{nickname}</span>. Let&apos;s begin.
          </h1>
          <p className="font-garamond text-base text-[#4A4A4A]/80">
            {getStep5Body(state.motivationType)}
          </p>
          <button
            type="button"
            onClick={() => completeAndNavigate("dashboard")}
            className="text-sm text-[#4A4A4A]/60 hover:text-[#4A4A4A]"
          >
            Or take me to the dashboard — I&apos;ll explore on my own →
          </button>
        </div>
      )}

      <div className="w-full border-t border-black/5" />
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <button
            type="button"
            onClick={prevStep}
            disabled={step === 1}
            className="rounded-full border border-[#4A90E2] bg-white px-6 sm:px-8 py-4 sm:py-[18px] text-sm font-semibold leading-[20px] text-[#4A90E2] transition-colors hover:bg-[#4A90E2]/5 disabled:opacity-40 disabled:pointer-events-none"
          >
            Prev
          </button>
        <Button
          type="button"
          onClick={handleContinue}
          disabled={(step < 8 && !canProceed) || isMutating}
          className="flex items-center gap-2 rounded-full !bg-orange hover:!bg-[#C55A1D] px-6 sm:px-8 py-4 sm:py-[18px] text-sm font-semibold leading-[20px] text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {step === 8
            ? getPrimaryCTA(state.motivationType, state.expressionMode).label
            : "Continue"}
        </Button>
      </div>
    </div>
  );
}

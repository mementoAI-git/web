"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/hooks/use-store";
import { isEmpty } from "@/utility";
import {
  AGE_BAND_OPTIONS,
  MEMENTO_FOR_OPTIONS,
  PASSION_OPTIONS,
  MOTIVATION_OPTIONS,
  DIMENSION_OPTIONS,
  EXPRESSION_OPTIONS,
} from "@/features/onboarding-groot/types";
import { getPrimaryCTA, getStep5Body } from "@/features/onboarding-groot/adaptive";
import { OnboardSelectionCard } from "./OnboardSelectionCard";
import { useOnboardQuestionsState, ONBOARD_QUESTIONS_STEP_LABELS } from "./useOnboardQuestionsState";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";
import { mutate } from "swr";
import { storageKeys } from "@/utility/constant";
import { saveOnboarding } from "@/api/onboarding";

const MAX_EXPRESSION = 2;
const ALL_EXPRESSION_MODES = EXPRESSION_OPTIONS.map((o) => o.value);
const ALL_MOTIVATION_TYPES = MOTIVATION_OPTIONS.map((o) => o.value);

export default function MiscPage() {
  const { user } = useStore();
  const navigate = useNavigate();
  const nickname = (user?.nickname as string) || "there";
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [passionsInputValue, setPassionsInputValue] = useState("");
  const [mementoForInputValue, setMementoForInputValue] = useState("");
  const [dimensionsInputValue, setDimensionsInputValue] = useState("");

  const {
    state,
    nextStep,
    prevStep,
    canAdvance,
    setAgeBand,
    setWhereFrom,
    setMementoFor,
    addMementoForFreetext,
    removeMementoForFreetext,
    setPriorityDimensions,
    addDimensionsFreetext,
    removeDimensionsFreetext,
    setPassions,
    addPassionFreetext,
    removePassionFreetext,
    setMotivationType,
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

  const allMotivationSelected = state.motivationType === "__all__";
  const handleAllMotivation = () => {
    setMotivationType(allMotivationSelected ? null : "__all__");
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
          mementoForFreetext: state.mementoForFreetext.length > 0 ? state.mementoForFreetext.join(", ") : undefined,
          passions: state.passions,
          passionsFreetext: state.passionsFreetext.length > 0 ? state.passionsFreetext.join(", ") : undefined,
          lifeContext: state.lifeContext,
          motivationType:
            state.motivationType === "__all__"
              ? "all"
              : (state.motivationType ?? ""),
          priorityDimensions: state.priorityDimensions,
          dimensionsFreetext: state.dimensionsFreetext.length > 0 ? state.dimensionsFreetext.join(", ") : undefined,
          expressionMode: state.expressionMode,
          isComplete: true,
          stepReached: 7,
        });
        await completeOnboarding({
          dob: "",
          join_reasons:
            state.motivationType === "__all__"
              ? ALL_MOTIVATION_TYPES
              : state.motivationType
                ? [state.motivationType]
                : [],
          self_description: state.passions.join(", ") || state.passionsFreetext.join(", "),
          current_priority:
            [
              ...state.priorityDimensions.filter((d) => d !== "something_else"),
              ...state.dimensionsFreetext,
            ].join(", ") || "",
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
    if (!canProceed && step !== 7) return;
    setValidationAttempted(false);

    if (step === 7) {
      const motivationForCTA =
        state.motivationType === "__all__" ? "explorer" : state.motivationType;
      const { action } = getPrimaryCTA(motivationForCTA, state.expressionMode);
      completeAndNavigate(action);
    } else {
      nextStep();
    }
  };

  const showIntro = step === 1;
  const TOTAL_STEPS = 7;

  return (
    <div ref={contentRef} className="flex flex-col gap-11">
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
        <div className="flex flex-col gap-1">
          <h3 className="font-garamond text-[24px] font-medium leading-[38px] text-[#4A4A4A]">
            Okay, <span className="capitalize">{nickname}</span>. I&apos;ve got some questions for you.
          </h3>
          <p className="font-garamond text-[20px] font-normal leading-[28px] text-[#4A4A4A]/80">
            These questions will help Memento better personalize your experience
            <br />
            on the product.
          </p>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col gap-2">
            <p className="font-garamond text-lg sm:text-xl font-medium text-[#4A4A4A]">
              How old are you?<span className="text-[#4A90E2]">*</span>
            </p>
            {validationAttempted && !state.ageBand && (
              <p className="text-sm text-[#C55A1D]">Please pick an age range.</p>
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
          <div className="flex flex-col gap-0 space-y-2">
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
          {validationAttempted &&
            state.mementoFor.includes("something_else") &&
            state.mementoFor.length === 1 &&
            state.mementoForFreetext.length < 1 && (
              <p className="text-sm text-[#C55A1D]">Please add at least one.</p>
            )}
          <div className="flex flex-wrap gap-2">
            {MEMENTO_FOR_OPTIONS.map((opt) => (
              <OnboardSelectionCard
                key={opt.value}
                value={opt.value}
                label={opt.label}
                icon={opt.icon || undefined}
                isSelected={state.mementoFor.includes(opt.value)}
                onClick={() => toggleMementoFor(opt.value)}
                variant={opt.value === "something_else" ? "add" : undefined}
              />
            ))}
          </div>
          {state.mementoFor.includes("something_else") && (
            <div className="mt-2 space-y-2">
              {state.mementoForFreetext.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {state.mementoForFreetext.map((item, i) => (
                    <span
                      key={`${item}-${i}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#E26A24]/20 bg-[#E26A24]/[0.06] px-2 py-1 text-sm text-[#4A4A4A]"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeMementoForFreetext(i)}
                        className="ml-0.5 rounded p-0.5 text-[#4A4A4A]/60 hover:bg-[#E26A24]/10 hover:text-[#4A4A4A]"
                        aria-label={`Remove ${item}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                type="text"
                value={mementoForInputValue}
                onChange={(e) => setMementoForInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addMementoForFreetext(mementoForInputValue);
                    setMementoForInputValue("");
                  }
                }}
                placeholder="e.g. my mentor, a community... (press Enter to add)"
                maxLength={200}
                className="w-full rounded-xl border-[1.5px] border-[#E4D9CC] bg-[#FFFCF8] px-4 py-3 text-[#2C1F15] placeholder:text-[#B0A098] focus:border-[#C8956C] focus:outline-none"
              />
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-6">
          <div>
            <p className="font-garamond text-lg sm:text-xl font-medium text-[#4A4A4A]">
              What are some things that interest you?<span className="text-[#4A90E2]">*</span>{" "}
              <span className="text-[#B87333] text-base">(multi-select)</span>
            </p>
            <p className="mt-1 font-garamond text-xl text-[#4A4A4A]/70">
              This helps us personalize your Memento experience.
            </p>
          </div>
          {validationAttempted && state.passions.length < 1 && (
            <p className="text-sm text-[#C55A1D]">Pick at least one.</p>
          )}
          <div className="flex flex-wrap gap-2">
{PASSION_OPTIONS.map((opt) => (
                <OnboardSelectionCard
                  key={opt.value}
                  value={opt.value}
                  label={opt.label}
                  icon={opt.icon || undefined}
                  isSelected={state.passions.includes(opt.value)}
                  onClick={() => togglePassion(opt.value)}
                  variant={opt.value === "something_else" ? "add" : undefined}
                />
              ))}
          </div>
          {state.passions.includes("something_else") && (
            <div className="mt-2 space-y-2">
              {state.passionsFreetext.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {state.passionsFreetext.map((item, i) => (
                    <span
                      key={`${item}-${i}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#E26A24]/20 bg-[#E26A24]/[0.06] px-2 py-1 text-sm text-[#4A4A4A]"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removePassionFreetext(i)}
                        className="ml-0.5 rounded p-0.5 text-[#4A4A4A]/60 hover:bg-[#E26A24]/10 hover:text-[#4A4A4A]"
                        aria-label={`Remove ${item}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                type="text"
                value={passionsInputValue}
                onChange={(e) => setPassionsInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPassionFreetext(passionsInputValue);
                    setPassionsInputValue("");
                  }
                }}
                placeholder="e.g. gardening, vintage cars... (press Enter to add)"
                maxLength={200}
                className="w-full rounded-xl border-[1.5px] border-[#E4D9CC] bg-[#FFFCF8] px-4 py-3 text-[#2C1F15] placeholder:text-[#B0A098] focus:border-[#C8956C] focus:outline-none"
              />
            </div>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <p className="font-garamond text-lg sm:text-xl font-medium text-[#4A4A4A]">
            What brings you to Memento?<span className="text-[#4A90E2]">*</span>
          </p>
          {validationAttempted && !state.motivationType && (
            <p className="text-sm text-[#C55A1D]">Please choose one.</p>
          )}
          <div className="flex flex-wrap gap-2">
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
            <OnboardSelectionCard
              value="__all__"
              label="All of the above"
              icon="✨"
              isSelected={allMotivationSelected}
              onClick={handleAllMotivation}
            />
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <p className="font-garamond text-lg sm:text-xl font-medium text-[#4A4A4A]">
            What matters most to you now?<span className="text-[#4A90E2]">*</span>{" "}
            <span className="text-[#B87333] text-base">(multi-select)</span>
          </p>
          {validationAttempted && state.priorityDimensions.length < 1 && (
            <p className="text-sm text-[#C55A1D]">Pick at least one.</p>
          )}
          {validationAttempted &&
            state.priorityDimensions.includes("something_else") &&
            state.priorityDimensions.length === 1 &&
            state.dimensionsFreetext.length < 1 && (
              <p className="text-sm text-[#C55A1D]">Please add at least one.</p>
            )}
          <div className="flex flex-wrap gap-2">
            {DIMENSION_OPTIONS.map((opt) => (
              <OnboardSelectionCard
                key={opt.value}
                value={opt.value}
                label={opt.label}
                icon={opt.icon || undefined}
                isSelected={state.priorityDimensions.includes(opt.value)}
                onClick={() => toggleDimension(opt.value)}
                variant={opt.value === "something_else" ? "add" : undefined}
              />
            ))}
          </div>
          {state.priorityDimensions.includes("something_else") && (
            <div className="mt-2 space-y-2">
              {state.dimensionsFreetext.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {state.dimensionsFreetext.map((item, i) => (
                    <span
                      key={`${item}-${i}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#E26A24]/20 bg-[#E26A24]/[0.06] px-2 py-1 text-sm text-[#4A4A4A]"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeDimensionsFreetext(i)}
                        className="ml-0.5 rounded p-0.5 text-[#4A4A4A]/60 hover:bg-[#E26A24]/10 hover:text-[#4A4A4A]"
                        aria-label={`Remove ${item}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                type="text"
                value={dimensionsInputValue}
                onChange={(e) => setDimensionsInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addDimensionsFreetext(dimensionsInputValue);
                    setDimensionsInputValue("");
                  }
                }}
                placeholder="e.g. legacy, creativity... (press Enter to add)"
                maxLength={200}
                className="w-full rounded-xl border-[1.5px] border-[#E4D9CC] bg-[#FFFCF8] px-4 py-3 text-[#2C1F15] placeholder:text-[#B0A098] focus:border-[#C8956C] focus:outline-none"
              />
            </div>
          )}
        </div>
      )}

      {step === 6 && (
        <div className="space-y-4">
          <p className="font-garamond text-lg sm:text-xl font-medium text-[#4A4A4A]">
            How would you most like to add to your Memento?<span className="text-[#4A90E2]">*</span>{" "}
            <span className="text-[#B87333] text-base">(pick up to 2)</span>
          </p>
          {validationAttempted && state.expressionMode.length < 1 && (
            <p className="text-sm text-[#C55A1D]">Pick at least one.</p>
          )}
          <div className="flex flex-wrap gap-2">
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

      {step === 7 && (
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="font-garamond text-2xl sm:text-[28px] font-medium leading-tight text-[#4A4A4A]">
            You&apos;re all set, <span className="capitalize">{nickname}</span>. Let&apos;s begin.
          </h1>
          <p className="font-garamond text-base text-[#4A4A4A]/80">
            {getStep5Body(
              state.motivationType === "__all__" ? "explorer" : state.motivationType
            )}
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
        <Button
          type="button"
          variant="secondary"
          onClick={prevStep}
          disabled={step === 1}
          className="!bg-transparent border border-black/10 rounded-full px-6 sm:px-8 py-4 sm:py-[18px] text-sm font-semibold leading-[20px] disabled:opacity-40 disabled:pointer-events-none"
        >
          Prev
        </Button>
        <Button
          type="button"
          onClick={handleContinue}
          disabled={(step < 7 && !canProceed) || isMutating}
          className="flex items-center gap-2 rounded-full !bg-orange hover:!bg-[#C55A1D] px-6 sm:px-8 py-4 sm:py-[18px] text-sm font-semibold leading-[20px] text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {step === 7
            ? getPrimaryCTA(
                state.motivationType === "__all__" ? "explorer" : state.motivationType,
                state.expressionMode
              ).label
            : "Continue"}
        </Button>
      </div>
    </div>
  );
}

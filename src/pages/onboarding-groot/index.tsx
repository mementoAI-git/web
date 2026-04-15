import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  OnboardingShell,
  IdentityStep1,
  IdentityStep2,
  IdentityStep3,
  IdentityStep4,
  OnboardingStep2,
  OnboardingStep3,
  OnboardingStep4,
  OnboardingStep5,
  StepTransition,
  useOnboardingState,
  getPrimaryCTA,
  STEP_LABELS,
  ADVANCE_LABELS,
} from "@/features/onboarding-groot";
import type { OnboardingState } from "@/features/onboarding-groot/types";

import {
  skipOnboarding,
  fetchOnboardingDetails,
  mapOnboardingDetailsToState,
} from "@/api/onboarding";
import endpoint from "@/api/endpoint";
import { useMutation } from "@/hooks/use-api";
import { useStore } from "@/hooks/use-store";

/** Loading state for revisit mode while fetching prefill */
function OnboardingLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-[var(--onboarding-text-secondary)]">
      Loading your preferences…
    </div>
  );
}

interface OnboardingFormProps {
  initialState: Partial<OnboardingState> | undefined;
  isRevisitMode: boolean;
}

function OnboardingForm({ initialState, isRevisitMode }: OnboardingFormProps) {
  const navigate = useNavigate();
  const [validationAttempted, setValidationAttempted] = useState(false);
  const { trigger: saveOnboarding, isLoading: isSavingOnboarding } = useMutation(endpoint.onboarding, { method: 'POST' });

  const { user, setUser } = useStore();
  const {
    state,
    advanceStep,
    goBack,
    complete,
    skip,
    canAdvance,
    validationErrors,
    setFullName,
    setDisplayName,
    setAgeBand,
    setWhereFrom,
    setMementoFor,
    setPassions,
    setPassionsFreetext,
    setLifeContext,
    setMotivationType,
    setPriorityDimensions,
    setExpressionMode,
  } = useOnboardingState({ initialState });

  const step = state.currentStep;
  const errors = validationAttempted ? validationErrors(step) : {};
  const canProceed = canAdvance(step);
  // Always allow clicking Continue so validation can be triggered on click
  const shellCanAdvance = step === 8 ? canProceed : true;

  const persistAndComplete = async () => {
    complete();
    try {
      const [first_name, ...last_name] = state.fullName.trim().split(/\s+/);

      const join_reasons = [
        ...state.passions,
        ...(state.passionsFreetext?.trim() ? [state.passionsFreetext.trim()] : []),
      ];

      await saveOnboarding({
        first_name: first_name ?? "",
        last_name: last_name.join(" ") ?? "",
        join_reasons: join_reasons.length ? join_reasons : undefined,
        current_priority: state.priorityDimensions ? [...state.priorityDimensions] : [],
        nickname: state.displayName?.trim() || undefined,
        age_range: state.ageBand?.trim() || undefined,
        location: state.whereFrom?.trim() || undefined,
        prefered_communication_style: state.expressionMode?.[0]?.trim() || undefined,
        audience: state.mementoFor ? [...state.mementoFor] : [],
      });

      if (user && setUser) {
        setUser({ ...user, onboarded: true, onboarding_status: "completed" });
      }
    } catch {
      // Backend may not be ready; do nothing
    }
  };

  const handleAdvance = () => {
    setValidationAttempted(true);
    if (!canProceed) return;
    setValidationAttempted(false);
    if (step === 8) {
      const action = getPrimaryCTA(state.motivationType, state.expressionMode).action;
      handlePrimaryCTA(action);
    } else {
      advanceStep();
    }
  };

  const handleSkip = async () => {
    skip();
    try {
      await skipOnboarding();
      if (user && setUser) {
        setUser({ ...user, onboarding_status: "skipped" });
      }
    } finally {
      navigate("/overview");
    }
  };

  const handlePrimaryCTA = async (action: string) => {
    await persistAndComplete();
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
      case "dashboard":
      default:
        navigate("/overview");
    }
  };

  const handleSecondaryLink = async () => {
    await persistAndComplete();
    navigate("/overview");
  };

  const advanceLabel =
    step === 8
      ? isRevisitMode
        ? "Save changes →"
        : getPrimaryCTA(state.motivationType, state.expressionMode).label
      : ADVANCE_LABELS[step];

  const stepContent = (
    <>
      {step === 1 && (
        <IdentityStep1
          fullName={state.fullName}
          onFullNameChange={setFullName}
          displayName={state.displayName}
          onDisplayNameChange={setDisplayName}
          validationErrors={errors}
        />
      )}
      {step === 2 && (
        <IdentityStep2
          ageBand={state.ageBand}
          onAgeBandSelect={setAgeBand}
          whereFrom={state.whereFrom}
          onWhereFromChange={setWhereFrom}
          mementoFor={state.mementoFor}
          onMementoForChange={setMementoFor}
          validationErrors={errors}
        />
      )}
      {step === 3 && (
        <IdentityStep3
          passions={state.passions}
          onPassionsChange={setPassions}
          passionsFreetext={state.passionsFreetext}
          onPassionsFreetextChange={setPassionsFreetext}
          validationErrors={errors}
        />
      )}
      {step === 4 && (
        <IdentityStep4
          lifeContext={state.lifeContext}
          onLifeContextChange={setLifeContext}
          validationErrors={errors}
        />
      )}
      {step === 5 && (
        <OnboardingStep2
          motivationType={state.motivationType}
          onMotivationSelect={setMotivationType}
          validationErrors={errors}
        />
      )}
      {step === 6 && (
        <OnboardingStep3
          priorityDimensions={state.priorityDimensions}
          onDimensionsChange={setPriorityDimensions}
          validationErrors={errors}
        />
      )}
      {step === 7 && (
        <OnboardingStep4
          motivationType={state.motivationType}
          expressionMode={state.expressionMode}
          onExpressionModeChange={setExpressionMode}
          validationErrors={errors}
        />
      )}
      {step === 8 && (
        <OnboardingStep5
          displayName={state.displayName}
          motivationType={state.motivationType}
          onSecondaryLink={handleSecondaryLink}
        />
      )}
    </>
  );

  return (
    <OnboardingShell
      currentStep={step}
      totalSteps={8}
      stepLabel={STEP_LABELS[step]}
      canAdvance={shellCanAdvance}
      onAdvance={handleAdvance}
      onBack={goBack}
      onSkip={handleSkip}
      advanceLabel={advanceLabel}
      isSaving={isSavingOnboarding}
      showBack={step > 1}
      showSkip={step < 8 && !isRevisitMode}
      hideFooter={false}
    >
      <StepTransition stepKey={step}>{stepContent}</StepTransition>
    </OnboardingShell>
  );
}

export default function OnboardingGrootPage() {
  const [searchParams] = useSearchParams();
  const isRevisitMode = searchParams.get("mode") === "revisit";

  const [prefill, setPrefill] = useState<Partial<OnboardingState> | null>(
    isRevisitMode ? null : {}
  );

  useEffect(() => {
    if (isRevisitMode) {
      fetchOnboardingDetails().then((data) => {
        setPrefill(data ? mapOnboardingDetailsToState(data) : {});
      });
    }
  }, [isRevisitMode]);

  if (prefill === null) {
    return <OnboardingLoading />;
  }

  return (
    <OnboardingForm
      initialState={prefill ?? undefined}
      isRevisitMode={isRevisitMode}
    />
  );
}

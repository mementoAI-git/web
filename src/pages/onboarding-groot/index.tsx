import { useState } from "react";
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
import { storageKeys } from "@/utility/constant";
import { saveOnboarding } from "@/api/onboarding";

export default function OnboardingGrootPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRevisitMode = searchParams.get("mode") === "revisit";

  const [validationAttempted, setValidationAttempted] = useState(false);

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
  } = useOnboardingState({
    initialState: isRevisitMode ? undefined : undefined,
    // TODO: In revisit mode, fetch GET /api/host/profile and pass as initialState
    // when backend is ready
  });

  const step = state.currentStep;
  const errors = validationAttempted ? validationErrors(step) : {};
  const canProceed = canAdvance(step);
  // Always allow clicking Continue so validation can be triggered on click
  const shellCanAdvance = step === 8 ? canProceed : true;

  const persistAndComplete = async () => {
    complete();
    try {
      await saveOnboarding({
        fullName: state.fullName.trim(),
        displayName: state.displayName.trim(),
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
    } catch {
      // Backend may not be ready; continue with localStorage fallback
    }
    try {
      localStorage.setItem(storageKeys.onboardingComplete, "true");
    } catch {
      // ignore
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

  const handleSkip = () => {
    skip();
    navigate("/overview");
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
      showBack={step > 1}
      showSkip={step < 8 && !isRevisitMode}
      hideFooter={false}
    >
      <StepTransition stepKey={step}>{stepContent}</StepTransition>
    </OnboardingShell>
  );
}

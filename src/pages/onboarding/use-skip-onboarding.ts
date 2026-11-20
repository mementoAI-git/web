import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { postFetcher } from "@/api/fetcher";
import { reportFetcherError } from "@/api/report-fetcher-error";
import endpoint from "@/api/endpoint";
import { useStore } from "@/hooks/use-store";
import { useFinishOnboarding } from "./use-finish-onboarding";
import { reasonOptions } from "./flow-options";
import { clearOnboardingDraft, readOnboardingDraft } from "./use-onboarding-draft";
import { trackOnboardingSkipped } from "./onboarding-analytics";

export function useSkipOnboarding() {
  const { user } = useStore();
  const finishOnboarding = useFinishOnboarding();
  const navigate = useNavigate();
  const pending = useRef(false);
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const [busy, setBusy] = useState(false);
  const skip = async () => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      // Save what they've answered so far, so returning to onboarding starts filled in.
      const draft = user?._id ? readOnboardingDraft(user._id) : null;
      const answers = draft
        ? {
            self_description: draft.about.trim() || undefined,
            join_reasons: draft.reasons,
            current_priority: draft.areas,
            motivationType: reasonOptions.find((option) => draft.reasons.includes(option.value))?.motivation,
          }
        : {};
      const result = await postFetcher(endpoint.onboardingSkip, { arg: answers });
      if (!active.current) return;
      if (!result?.success) throw new Error(result?.message || "Couldn’t skip onboarding. Please retry.");
      const status = result.data && typeof result.data === "object" && "onboarding_status" in result.data ? result.data.onboarding_status : undefined;
      // The API holds the answers now; a return starts from the beginning with them filled in.
      if (user?._id) clearOnboardingDraft(user._id);
      trackOnboardingSkipped();
      finishOnboarding(status === "completed" || user?.onboarding_status === "completed" ? "completed" : "skipped");
      navigate("/overview");
    } catch (error) {
      if (!active.current) return;
      reportFetcherError(error, "Couldn’t skip onboarding. Please retry.");
    } finally { pending.current = false; if (active.current) setBusy(false); }
  };
  return { skip, busy };
}

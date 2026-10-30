import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { postFetcher } from "@/api/fetcher";
import { reportFetcherError } from "@/api/report-fetcher-error";
import endpoint from "@/api/endpoint";
import { useStore } from "@/hooks/use-store";

export function useSkipOnboarding() {
  const { user, setUser } = useStore();
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
      const result = await postFetcher(endpoint.onboardingSkip, { arg: {} });
      if (!active.current) return;
      if (!result?.success) throw new Error(result?.message || "Couldn’t skip onboarding. Please retry.");
      const status = result.data && typeof result.data === "object" && "onboarding_status" in result.data ? result.data.onboarding_status : undefined;
      if (user) setUser?.({ ...user, onboarding_status: status === "completed" || user.onboarding_status === "completed" ? "completed" : "skipped" });
      navigate("/overview");
    } catch (error) {
      if (!active.current) return;
      reportFetcherError(error, "Couldn’t skip onboarding. Please retry.");
    } finally { pending.current = false; if (active.current) setBusy(false); }
  };
  return { skip, busy };
}

"use client";

import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import endpoint from "@/api/endpoint";
import Spinner from "@/components/spinner";
import useFetcher from "@/hooks/use-fetcher";
import { useStore } from "@/hooks/use-store";
import { reportFetcherError } from "@/api/report-fetcher-error";
import { mutate } from "swr";
import { Input } from "@/components/ui/input";
import { onboardingAssets as assets } from "../assets";
import { useTrackOnboardingStep } from "../onboarding-analytics";
import {
  OnboardingActions,
  OnboardingButton,
  OnboardingCard,
  OnboardingTitle,
} from "../components/onboarding-card";

export default function NicknamePage() {
  useTrackOnboardingStep("nickname");
  const navigate = useNavigate();
  const { user, setUser } = useStore();
  const pending = useRef(false);
  const [name, setName] = useState(user?.nickname ?? "");
  const { isMutating, trigger: updateProfile } = useFetcher(
    endpoint.profile,
    "put",
  );

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || pending.current) return;
    pending.current = true;

    try {
      const trimmed = name.trim();
      const result = await updateProfile({ nickname: trimmed });
      if (!result?.success) throw new Error(result?.message || "Couldn’t save your name.");
      void mutate(endpoint.profile).catch(() => undefined);
      if (user && setUser) {
        setUser({ ...user, nickname: trimmed });
      }
      navigate("/onboarding/misc");
    } catch (error) {
      reportFetcherError(error, "We couldn’t save your name. Please try again.");
    } finally {
      pending.current = false;
    }
  }, [name, updateProfile, navigate, user, setUser]);

  return (
    <OnboardingCard>
      <div className="flex flex-col gap-3">
        <img
          src={assets["19031-32001/imgNotoBouquet"]}
          alt=""
          className="self-start"
        />
        <OnboardingTitle>
          How should we address <em className="text-text-brand-strong">you</em>
        </OnboardingTitle>
        <p className="max-w-[372px] text-sm leading-5 text-text-neutral-strong">
          We’ll use your name to personalize your experience and how Memento AI
          talks to you.
        </p>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
        className="flex flex-col gap-6"
      >
        <div className="flex min-h-[140px] flex-col gap-2">
          <label htmlFor="onboard-name" className="sr-only">
            Name
          </label>
          <Input
            id="onboard-name"
            autoComplete="nickname"
            maxLength={100}
            value={name}
            disabled={isMutating}
            onChange={(event) => {
              setName(event.target.value);
            }}
            placeholder="Eg: Jane or a Nickname"
            className="h-14 rounded-lg border-stroke-neutral-weak bg-fill-neutral-weaker p-4 text-base leading-6 text-text-neutral-strong placeholder:text-text-neutral-weaker md:text-base"
          />

        </div>
        <OnboardingActions>
          <OnboardingButton
            type="button"
            variant="outline"
            onClick={() => navigate("/onboarding/welcome")}
            disabled={isMutating}
          >
            Back
          </OnboardingButton>
          <OnboardingButton type="submit" disabled={!name.trim() || isMutating}>
            <span>Continue</span>
            <Spinner className="!size-4" loading={isMutating} />
          </OnboardingButton>
        </OnboardingActions>
      </form>
    </OnboardingCard>
  );
}

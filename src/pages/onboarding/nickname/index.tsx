"use client";

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import endpoint from "@/api/endpoint";
import Spinner from "@/components/spinner";
import useFetcher from "@/hooks/use-fetcher";
import { useStore } from "@/hooks/use-store";
import { isEmpty } from "@/utility";
import { mutate } from "swr";
import { Input } from "@/components/ui/input";
import { onboardingAssets as assets } from "../assets";
import {
  OnboardingActions,
  OnboardingButton,
  OnboardingCard,
  OnboardingTitle,
} from "../components/onboarding-card";

export default function NicknamePage() {
  const navigate = useNavigate();
  const { user, setUser } = useStore();
  const [error, setError] = useState("");
  const [name, setName] = useState(user?.nickname ?? "");
  const { isMutating, trigger: updateProfile } = useFetcher(
    endpoint.profile,
    "put",
  );

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || isMutating) return;

    try {
      const trimmed = name.trim();
      await updateProfile({ nickname: trimmed });
      await mutate(endpoint.profile);
      if (user && setUser) {
        setUser({ ...user, nickname: trimmed });
      }
      navigate("/onboarding/misc");
    } catch (error) {
      console.error("Failed to update profile:", error);
      setError("We couldn’t save your name. Please try again.");
    }
  }, [isMutating, name, updateProfile, navigate, user, setUser]);

  useEffect(() => {
    if (isEmpty(name) && !isEmpty(user?.nickname)) {
      setName(user?.nickname as string);
    }
  }, [user?.nickname, name]);

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
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
            placeholder="Eg: Jane or a Nickname"
            className="h-14 rounded-lg border-stroke-neutral-weak bg-fill-neutral-weaker p-4 text-base leading-6 text-text-neutral-strong placeholder:text-text-neutral-weaker md:text-base"
          />
          {error && (
            <p role="alert" className="text-sm text-text-error-strong">
              {error}
            </p>
          )}
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

"use client";

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import endpoint from "@/api/endpoint";
import Spinner from "@/components/spinner";
import useFetcher from "@/hooks/use-fetcher";
import { useStore } from "@/hooks/use-store";
import { isEmpty } from "@/utility";
import { mutate } from "swr";
import { Button } from "@/components/ui/button";

export default function NicknamePage() {
  const navigate = useNavigate();
  const { user, setUser } = useStore();
  const [name, setName] = useState(user?.nickname ?? "");
  const { isMutating, trigger: updateProfile } = useFetcher(endpoint.profile, "put");

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
    }
  }, [isMutating, name, updateProfile, navigate, user, setUser]);

  useEffect(() => {
    if (isEmpty(name) && !isEmpty(user?.nickname)) {
      setName(user?.nickname as string);
    }
  }, [user?.nickname, name]);

  return (
    <div className="flex min-h-full items-start justify-center py-4 sm:py-6 lg:items-center lg:py-0">
      <div className="w-full max-w-[700px] rounded-[24px] bg-bg-neutral p-5 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <p className="font-inter text-[18px] font-normal leading-7 text-text-neutral-strong sm:text-[20px] sm:leading-7">
              Before we proceed, what should we call you?
            </p>
          </div>

          <div className="w-full space-y-1.5">
            <label htmlFor="onboard-name" className="block text-sm font-medium text-text-neutral-strong">
              Name<span className="text-v3-brand-strong">*</span>
            </label>
            <input
              id="onboard-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a preferred name or nickname"
              className="w-full rounded-lg border border-stroke-neutral-weak bg-bg-neutral px-[14px] py-[10px] text-sm leading-6 text-text-neutral-strong shadow-sm placeholder:text-text-neutral-weaker focus:border-stroke-brand-strong focus:outline-none"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || isMutating}
            className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 self-start rounded-full border-0 bg-fill-neutral-strong px-8 text-sm font-semibold leading-5 text-text-inverse-strong shadow-none transition-[transform,opacity] duration-150 ease-out hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <span>Continue</span>
            <Spinner className="!size-4" loading={isMutating} />
          </Button>
        </div>
      </div>
    </div>
  );
}

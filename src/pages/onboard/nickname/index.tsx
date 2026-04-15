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
      navigate("/onboard/misc");
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
    <div className="flex h-fit flex-col gap-6 items-center justify-start max-w-md mx-auto pt-16">
      <p className="font-garamond text-2xl font-normal leading-[32px] sm:leading-[36px] text-v3-text-strong text-center">
        Before we proceed, what should I call you?
      </p>
      <div className="w-full space-y-2">
        <label htmlFor="onboard-name" className="mb-2 block text-sm font-medium text-v3-text-weak">
          Name<span className="text-v3-brand-strong">*</span>
        </label>
        <input
          id="onboard-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your First name or Nickname"
          className="w-full rounded-xl border-[1.5px] border-v3-stroke-weak bg-v3-fill-weaker px-4 py-3 text-v3-text-strong placeholder:text-v3-text-weaker focus:border-v3-brand-strong focus:outline-none"
        />
      </div>
      <Button
        onClick={handleSubmit}
        disabled={!name.trim() || isMutating}
        className="flex h-fit items-center gap-2 rounded-[64px] !bg-fill-brand-strong hover:!bg-fill-brand-weak px-8 py-[14px] text-sm font-semibold leading-[20px] text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span>Continue</span>
        <Spinner className="!size-4" loading={isMutating} />
      </Button>
    </div>
  );
}


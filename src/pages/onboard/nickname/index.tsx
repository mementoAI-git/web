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
  const { user } = useStore();
  const [name, setName] = useState(user?.nickname ?? "");
  const { isMutating, trigger: updateProfile } = useFetcher(endpoint.profile, "put");

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || isMutating) return;

    try {
      await updateProfile({ nickname: name.trim() });
      await mutate(endpoint.profile);
      navigate("/onboard/misc");
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  }, [isMutating, name, updateProfile, navigate]);

  useEffect(() => {
    if (isEmpty(name) && !isEmpty(user?.nickname)) {
      setName(user?.nickname as string);
    }
  }, [user?.nickname, name]);

  return (
    <div className="flex flex-col gap-8 items-center justify-center max-w-md mx-auto">
      <p className="font-garamond text-2xl sm:text-[28px] font-medium leading-[32px] sm:leading-[36px] text-[#4A4A4A] text-center">
        Before we proceed, what should I call you?
      </p>
      <div className="w-full space-y-2">
        <label htmlFor="onboard-name" className="mb-2 block text-sm font-semibold text-[#2C1F15]">
          Name<span className="text-[#C8956C]">*</span>
        </label>
        <input
          id="onboard-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., John"
          className="w-full rounded-xl border-[1.5px] border-[#E4D9CC] bg-[#FFFCF8] px-4 py-3 text-[#2C1F15] placeholder:text-[#B0A098] focus:border-[#C8956C] focus:outline-none"
        />
      </div>
      <Button
        onClick={handleSubmit}
        disabled={!name.trim() || isMutating}
        className="flex items-center gap-2 rounded-full !bg-orange hover:!bg-[#C55A1D] px-8 py-[18px] text-sm font-semibold leading-[20px] text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span>Continue</span>
        <Spinner className="!size-4" loading={isMutating} />
      </Button>
    </div>
  );
}


"use client";

import endpoint from "@/api/endpoint";
import { Textinput } from "@/components/Form";
import Spinner from "@/components/Spinner";
import useFetcher from "@/hooks/use-fetcher";
import { useStore } from "@/hooks/use-store";
import { isEmpty } from "@/utility";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { mutate } from "swr";

export default function NicknamePage() {
  const router = useRouter();
  const { user } = useStore()
  const [name, setName] = useState(user?.nickname);
  const { isMutating, trigger: updateProfile } = useFetcher(endpoint.profile, "put");

  const handleSubmit = useCallback(async () => {
    if (!name?.trim() || isMutating) return;

    try {
      await updateProfile({ nickname: name.trim() });
      mutate(endpoint.profile)
      router.push("/onboard/misc");
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  }, [isMutating, name]);

  useEffect(() => {
    if (isEmpty(name) && !isEmpty(user?.nickname)) {
      setName(user?.nickname)
    }
  }, [user?.nickname])
  return (
    <div className="flex flex-1 flex-col gap-10 p-10">
      <span className="text-2xl leading-[28px] font-garamond text-gray-950/80 animate-fadeIn" style={{ animationDelay: '0ms' }}>Before we proceed, what should i call you?</span>
      <div className="animate-fadeIn" style={{ animationDelay: '200ms' }}>
        <Textinput
          label="Name"
          placeholder="Groot"
          className="flex-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="w-full border-t border-black/5 animate-fadeIn" style={{ animationDelay: '400ms' }} />
      <div >
        <button
          onClick={handleSubmit}
          disabled={!name?.trim() || isMutating}
          className="bg-blue-6 flex items-center gap-2 text-white text-sm leading-[20px] cursor-pointer font-semibold rounded-full py-[18px] px-8 disabled:bg-blue-6/40 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <span>Continue</span>
          <Spinner className="" loading={isMutating} />
        </button>
      </div>
    </div>
  )
}

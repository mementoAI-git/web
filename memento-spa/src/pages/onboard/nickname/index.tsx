"use client";

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import endpoint from "@/api/endpoint";
import { Textinput } from "@/components/Form";
import Spinner from "@/components/spinner";
import useFetcher from "@/hooks/use-fetcher";
import { useStore } from "@/hooks/use-store";
import { isEmpty } from "@/utility";
import { mutate } from "swr";

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
    <div className="flex flex-1 flex-col gap-10 p-10">
      <span
        className="animate-fadeIn text-2xl font-garamond text-gray-950/80"
        style={{ animationDelay: "0ms" }}
      >
        Before we proceed, what should I call you?
      </span>
      <div className="animate-fadeIn" style={{ animationDelay: "200ms" }}>
        <Textinput
          label="Name"
          placeholder="Groot"
          className="flex-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div
        className="w-full border-t border-black/5 animate-fadeIn"
        style={{ animationDelay: "400ms" }}
      />
      <div>
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || isMutating}
          className="flex items-center gap-2 rounded-full bg-blue-6 px-8 py-[18px] text-sm font-semibold leading-[20px] text-white transition-colors duration-200 hover:bg-blue-7 disabled:cursor-not-allowed disabled:bg-blue-6/40"
        >
          <span>Continue</span>
          <Spinner className="!size-4" loading={isMutating} />
        </button>
      </div>
    </div>
  );
}


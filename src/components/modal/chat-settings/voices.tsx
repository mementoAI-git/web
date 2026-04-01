"use client";

import { useCallback } from "react";
import denverIcon from "@/assets/image/voices/denver.jpg";
import sueIcon from "@/assets/image/voices/sue.jpg";
import josefIcon from "@/assets/image/voices/josef.jpg";
import hannahIcon from "@/assets/image/voices/hannah.jpg";
import { useStore } from "@/hooks/use-store";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import { cn } from "@/utility";

const voices = [
  { title: "Denver", subtitle: "Male v1", image: denverIcon, voiceName: "Aoede" },
  { title: "Sue", subtitle: "Female v2", image: sueIcon, voiceName: "Charon" },
  { title: "Josef", subtitle: "Male v3", image: josefIcon, voiceName: "Fenrir" },
  { title: "Hannah", subtitle: "Female v4", image: hannahIcon, voiceName: "Kore" },
  { title: "Orus", subtitle: "Male v5", image: sueIcon, voiceName: "Orus" },
  { title: "Zephyr", subtitle: "Female v8", image: denverIcon, voiceName: "Zephyr" },
  { title: "Puck", subtitle: "Male v6", image: josefIcon, voiceName: "Puck" },
  { title: "Leda", subtitle: "Female v7", image: hannahIcon, voiceName: "Leda" },
];

export default function Voices() {
  const { user, setUser } = useStore();
  const { isMutating, trigger } = useFetcher(endpoint.profile, "put");
  const selectedVoice = user?.chat_voice || "Aoede";

  const handleVoiceSelect = useCallback(
    async (voiceName: string) => {
      if (selectedVoice === voiceName) return;
      try {
        const result = await trigger({ chat_voice: voiceName });
        if (result?.data) {
          setUser?.({ ...user, chat_voice: voiceName });
          toast.success(`Voice changed to ${voices.find((voice) => voice.voiceName === voiceName)?.title}`);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to update voice settings");
      }
    },
    [selectedVoice, trigger, setUser, user],
  );

  return (
    <div className="space-y-4">
      <p className="font-garamond text-xl font-medium text-text-neutral-strong">AI Voice</p>
      <div className="grid grid-cols-2 gap-3">
        {voices.map(({ title, subtitle, image, voiceName }) => (
          <button
            type="button"
            key={voiceName}
            className={cn(
              "flex items-center gap-3 rounded-xl border py-2.5 px-3 transition-all duration-200",
              selectedVoice === voiceName
                ? "border-2 border-stroke-brand-strong bg-fill-neutral-weakest"
                : "border-stroke-neutral-weaker hover:border-stroke-neutral-weak",
              isMutating ? "cursor-not-allowed opacity-50" : "cursor-pointer",
            )}
            onClick={() => !isMutating && handleVoiceSelect(voiceName)}
          >
            <img src={image} width={32} height={32} className="size-8 rounded-full object-cover" alt={title} />
            <div className="flex flex-col text-left">
              <span className="font-inter text-sm font-medium text-text-neutral-strong">{title}</span>
              <span className="font-inter text-xs text-text-neutral-weak">{subtitle}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}


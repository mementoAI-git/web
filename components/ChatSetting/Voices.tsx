"use client";

import Image from "next/image";
import { useCallback } from "react";
import denverIcon from "@/public/image/voices/denver.jpg"
import sueIcon from "@/public/image/voices/sue.jpg"
import josefIcon from "@/public/image/voices/josef.jpg"
import hannahIcon from "@/public/image/voices/hannah.jpg"
import { useStore } from "@/hooks/use-store";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import { cn } from "@/utility";

const voices = [
  { title: "Denver", subtitle: 'Male v1', image: denverIcon, voiceName: "Aoede" },
  { title: "Sue", subtitle: 'Female v2', image: sueIcon, voiceName: "Charon" },
  { title: "Josef", subtitle: 'Male v3', image: josefIcon, voiceName: "Fenrir" },
  { title: "Hannah", subtitle: 'Female v4', image: hannahIcon, voiceName: "Kore" },
  { title: "Orus", subtitle: 'Male v5', image: sueIcon, voiceName: "Orus" },
  { title: "Zephyr", subtitle: 'Female v8', image: denverIcon, voiceName: "Zephyr" },
  { title: "Puck", subtitle: 'Male v6', image: josefIcon, voiceName: "Puck" },
  { title: "Leda", subtitle: 'Female v7', image: hannahIcon, voiceName: "Leda" }
];

export default function Voices() {
  const { user, setUser } = useStore();
  const { isMutating, trigger } = useFetcher(endpoint.profile, "put");

  const selectedVoice = user?.chat_voice || "Aoede";

  const handleVoiceSelect = useCallback(async (voiceName: string) => {
    if (selectedVoice === voiceName) return;

    try {
      const result = await trigger({ chat_voice: voiceName });
      if (result?.data) {
        // Update local user state
        setUser({ ...user, chat_voice: voiceName });
        toast.success(`Voice changed to ${voices.find(v => v.voiceName === voiceName)?.title}`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update voice settings");
    }
  }, [selectedVoice, user, setUser, trigger]);

  return (
    <div className="space-y-5">
      <p className="text-sand-12 font-canela text-xl">AI Voice</p>
      <div className="grid grid-cols-2 gap-3">
        {voices.map(({ title, subtitle, image, voiceName }, i) => (
          <div
            key={i}
            className={cn(`border py-2.5 px-3 rounded-xl flex gap-3 items-center cursor-pointer transition-all duration-200`, {
              "border-blue-6 border-2 bg-blue-1": selectedVoice === voiceName,
              "opacity-50 cursor-not-allowed": isMutating,
              "border-[#EAECF0] hover:border-gray-300": selectedVoice !== voiceName
            })}
            onClick={() => !isMutating && handleVoiceSelect(voiceName)}
          >
            <Image
              src={image}
              width={32}
              height={32}
              className="size-8 rounded-full object-cover object-center"
              alt={title}
            />
            <div className="flex flex-col">
              <span className="text-sand-12 font-inter font-medium text-sm">{title}</span>
              <span className="font-inter text-xs text-[#667085]">{subtitle}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
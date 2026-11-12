import dayjs from "dayjs";
import { Mic } from "lucide-react";
import { hasAudioAttachment, recordingDurationLabel } from "./story-recording";
import { cn } from "@/lib/utils";
import type { IMemory } from "@/utility/interface";

/**
 * The line under a story's title in list view. Recordings lead with a mic,
 * then the date and the recording's length: "🎙 NOV 11, 2026 · 8:47".
 */
export function StoryRowMeta({ memory, className }: { memory: IMemory; className?: string }) {
  const date = memory.created_at ? dayjs(memory.created_at).format("MMM DD, YYYY") : "";
  const isRecording = hasAudioAttachment(memory);
  const duration = isRecording ? recordingDurationLabel(memory) : "";
  if (!date && !isRecording) return null;

  return (
    <p className={cn("flex items-center gap-1.5 whitespace-nowrap", className)}>
      {isRecording ? (
        <>
          <Mic className="size-3 shrink-0" strokeWidth={2} aria-hidden />
          <span className="sr-only">Recording, </span>
        </>
      ) : null}
      {date ? <span>{date}</span> : null}
      {duration ? (
        <>
          {date ? <span aria-hidden>·</span> : null}
          <span className="tabular-nums">
            <span className="sr-only">length </span>
            {duration}
          </span>
        </>
      ) : null}
    </p>
  );
}

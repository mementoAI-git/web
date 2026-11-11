import { classifyConversationFile } from "@/pages/dashboard/chat/conversation/conversation-assets";
import type { IMemory } from "@/utility/interface";

/** Recordings (voice notes and recorded conversations) carry an audio attachment. */
function audioAttachments(memory: IMemory) {
  return (memory.attachments ?? []).filter((attachment) => classifyConversationFile(attachment) === "audio");
}

export function hasAudioAttachment(memory: IMemory) {
  return audioAttachments(memory).length > 0;
}

/** `m:ss` (or `h:mm:ss`), as mobile's list rows show a recording's length. */
export function formatRecordingLength(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const ss = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** Total length of a story's recordings, or '' when unknown. */
export function recordingDurationLabel(memory: IMemory) {
  const seconds = audioAttachments(memory).reduce((total, attachment) => total + (Number(attachment.duration) || 0), 0);
  return seconds > 0 ? formatRecordingLength(seconds) : "";
}

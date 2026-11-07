import type { IFile, IMessage } from "@/utility/interface";

export type VoiceTextInput = { text: string; attachments?: IFile[] };
export type VoiceRuntime = { send: (input: VoiceTextInput) => Promise<void>; ready: boolean };
export type VoiceMessage = Partial<IMessage> & { _id: string; created_at: string; clientId?: string };
export type VoiceTimelineEntry = {
  id: string;
  connectionPersonId?: string;
  sessionId?: string;
  memoryId: string | null;
  created_at: string;
} & ({ kind: "started" | "ended" } | { kind: "message"; message: VoiceMessage });

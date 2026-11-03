/**
 * What this web build can do in a voice call. The API locks matching tools
 * into the Live session only when the token request lists them, so a build
 * that cannot carry out a tool never receives it. Screen control reads the
 * page itself (features/voice/screen).
 */
export const WEB_VOICE_CAPABILITIES = ["search_memories", "call_actions", "server_tools", "screen_control", "screen_fields"] as const;

/** On by default; set VITE_VOICE_TOOLS=false at build time to turn voice tools off. */
export function voiceToolsEnabled(flag: string | undefined = import.meta.env.VITE_VOICE_TOOLS): boolean {
  return flag !== "false";
}

function browserTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

/** Query params for GET /ai/ephemeral-token. */
export function voiceTokenParams({
  memoryId,
  tools,
  timeZone = browserTimeZone(),
}: {
  memoryId?: string | null;
  tools: boolean;
  /** IANA zone; defaults to the browser's. Null leaves it out. */
  timeZone?: string | null;
}): Record<string, string> {
  const params: Record<string, string> = {};
  if (memoryId) params.memory_id = memoryId;
  if (tools) params.capabilities = WEB_VOICE_CAPABILITIES.join(",");
  // The host's own date and weekday, for "next Friday" and "this morning".
  if (timeZone) params.timezone = timeZone;
  return params;
}

import { describe, expect, it } from "vitest";
import { voiceToolsEnabled, voiceTokenParams, WEB_VOICE_CAPABILITIES } from "./capabilities";

describe("voice tool capabilities", () => {
  it("asks for every ability web can carry out, screen control included", () => {
    expect(WEB_VOICE_CAPABILITIES).toEqual(["search_memories", "call_actions", "server_tools", "screen_control", "screen_fields"]);
  });

  it("is on unless VITE_VOICE_TOOLS is false", () => {
    expect(voiceToolsEnabled(undefined)).toBe(true);
    expect(voiceToolsEnabled("true")).toBe(true);
    expect(voiceToolsEnabled("false")).toBe(false);
  });

  it("builds token params with the conversation, abilities and the host's time zone", () => {
    expect(voiceTokenParams({ memoryId: "m1", tools: true, timeZone: "Africa/Lagos" })).toEqual({
      memory_id: "m1",
      capabilities: "search_memories,call_actions,server_tools,screen_control,screen_fields",
      timezone: "Africa/Lagos",
    });
  });

  it("leaves out what it does not have", () => {
    expect(voiceTokenParams({ memoryId: null, tools: false, timeZone: null })).toEqual({});
  });
});

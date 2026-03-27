import { describe, it, expect } from "vitest";
import {
  ONBOARDING_STREAM_TRAILER_MARK,
  splitOnboardingStreamBody,
  visibleOnboardingStreamPrefix,
  messagesForOnboardingApi,
  streamHostOnboardingChat,
} from "./host-onboarding-chat";
import type { HostOnboardingMessage } from "@/features/host-onboarding-chat/types";

describe("host-onboarding-chat API", () => {
  it("splitOnboardingStreamBody strips trailer and parses JSON", () => {
    const raw = `Hello world${ONBOARDING_STREAM_TRAILER_MARK}${JSON.stringify({
      suggestion_chips: ["a"],
      flow_complete: true,
      step_index: 2,
      total_steps: 6,
    })}`;
    expect(splitOnboardingStreamBody(raw)).toEqual({
      text: "Hello world",
      meta: {
        suggestion_chips: ["a"],
        flow_complete: true,
        step_index: 2,
        total_steps: 6,
      },
    });
  });

  it("visibleOnboardingStreamPrefix hides trailer mid-stream", () => {
    const partial = `Hi${ONBOARDING_STREAM_TRAILER_MARK}`;
    expect(visibleOnboardingStreamPrefix(partial)).toBe("Hi");
    expect(visibleOnboardingStreamPrefix("still typing")).toBe("still typing");
  });

  it("messagesForOnboardingApi strips ids and meta", () => {
    const messages: HostOnboardingMessage[] = [
      { id: "1", role: "user", content: "hey" },
      {
        id: "2",
        role: "assistant",
        content: "ok",
        meta: { kind: "onboarding_stream" },
      },
    ];
    expect(messagesForOnboardingApi(messages)).toEqual([
      { role: "user", content: "hey" },
      { role: "assistant", content: "ok" },
    ]);
  });

  it("streamHostOnboardingChat consumes MSW stream", async () => {
    let lastVisible = "";
    const { text, meta } = await streamHostOnboardingChat({
      messages: [],
      nickname: "N",
      bootstrap: true,
      onVisibleUpdate: (v) => {
        lastVisible = v;
      },
    });
    expect(text).toMatch(/glad you're here/i);
    expect(lastVisible).toBe(text);
    expect(meta?.suggestion_chips?.length).toBeGreaterThan(0);
  });
});

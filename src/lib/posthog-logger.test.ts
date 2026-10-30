import { beforeEach, expect, it, vi } from "vitest";
import posthog from "./posthog";
import { posthogLogger } from "./posthog-logger";

vi.mock("./posthog", () => ({
  default: { __loaded: true, logger: { info: vi.fn() } },
}));
beforeEach(() => {
  vi.clearAllMocks();
  posthog.__loaded = true;
});

it("exports explicit structured logs when analytics is configured", () => {
  posthogLogger.info("voice session started", {
    has_existing_conversation: true,
  });
  expect(posthog.logger.info).toHaveBeenCalledWith("voice session started", {
    has_existing_conversation: true,
  });
});

it("does not export logs without analytics", () => {
  posthog.__loaded = false;
  posthogLogger.info("voice session ended");
  expect(posthog.logger.info).not.toHaveBeenCalled();
});

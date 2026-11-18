import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => ({ init: vi.fn(), register: vi.fn() }));
vi.mock("posthog-js", () => ({ default: sdk }));

beforeEach(() => {
  vi.resetModules();
  sdk.init.mockClear();
  sdk.register.mockClear();
  vi.stubEnv("MODE", "production");
  vi.stubEnv("VITE_POSTHOG_KEY", "phc_test_project");
  vi.stubEnv("VITE_POSTHOG_HOST", "https://us.i.posthog.com");
});
afterEach(() => vi.unstubAllEnvs());

describe("PostHog initialization", () => {
  it("tracks navigation while keeping personal page content out of analytics", async () => {
    await import("./posthog");
    expect(sdk.init).toHaveBeenCalledWith(
      "phc_test_project",
      expect.objectContaining({
        api_host: "https://us.i.posthog.com",
        capture_pageview: "history_change",
        mask_all_text: true,
        mask_all_element_attributes: true,
        disable_session_recording: true,
      }),
    );
  });

  it("tags every event with the deployed environment and platform", async () => {
    vi.stubEnv("VITE_POSTHOG_ENVIRONMENT", "staging");
    await import("./posthog");
    expect(sdk.register).toHaveBeenCalledWith({
      environment: "staging",
      platform: "web",
    });
  });

  it("treats builds without a named environment as development", async () => {
    await import("./posthog");
    expect(sdk.register).toHaveBeenCalledWith({
      environment: "development",
      platform: "web",
    });
  });

  it.each(["VITE_POSTHOG_KEY", "VITE_POSTHOG_HOST"])(
    "keeps the app usable without %s",
    async (key) => {
      vi.stubEnv(key, "");
      vi.stubEnv("DEV", true);
      await expect(import("./posthog")).resolves.toBeDefined();
      expect(sdk.init).not.toHaveBeenCalled();
    },
  );

  it("does not send real analytics from automated tests", async () => {
    vi.stubEnv("MODE", "test");
    await import("./posthog");
    expect(sdk.init).not.toHaveBeenCalled();
  });

  it("removes login tokens and email addresses from analytics URLs", async () => {
    await import("./posthog");
    const options = sdk.init.mock.calls[0][1];
    const event = options.before_send({
      uuid: "test-event",
      event: "$pageview",
      properties: {
        $current_url:
          "https://memento.test/verify-email?email=private@example.com#token=secret",
        $referrer: "https://memento.test/login?token=secret",
        $set_once: {
          $initial_current_url: "https://memento.test/?token=secret",
        },
        attachment_count: 2,
      },
    });
    expect(event.properties.$current_url).toBe(
      "https://memento.test/verify-email",
    );
    expect(event.properties.$referrer).toBe("https://memento.test/login");
    expect(event.properties.$set_once.$initial_current_url).toBe(
      "https://memento.test/",
    );
    expect(event.properties.attachment_count).toBe(2);
  });
});

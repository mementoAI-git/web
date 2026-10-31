import posthog from "posthog-js";

const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_POSTHOG_HOST;
const hasPostHogKey = Boolean(
  posthogKey && posthogKey !== "your_posthog_project_token",
);
const hasPostHogHost = Boolean(
  posthogHost && posthogHost !== "your_posthog_host",
);

function sanitizeUrlProperties(
  properties: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(properties).map(([key, value]) => {
      if (
        (key === "$set" || key === "$set_once") &&
        value &&
        typeof value === "object"
      ) {
        return [key, sanitizeUrlProperties(value as Record<string, unknown>)];
      }
      if (typeof value === "string" && /url|referrer/i.test(key)) {
        try {
          const url = new URL(value);
          url.search = "";
          url.hash = "";
          url.username = "";
          url.password = "";
          return [key, url.toString()];
        } catch {
          // Non-URL values such as "$direct" are safe to retain.
        }
      }
      return [key, value];
    }),
  );
}

// Analytics must never prevent the app from loading or run during unit tests.
if (hasPostHogKey && hasPostHogHost && import.meta.env.MODE !== "test") {
  posthog.init(posthogKey, {
    api_host: posthogHost,
    capture_pageview: "history_change",
    logs: {
      serviceName: "memento-web",
      environment: import.meta.env.MODE,
    },
    // Product analytics without recording private journals, chats, or media.
    mask_all_text: true,
    mask_all_element_attributes: true,
    disable_session_recording: true,
    before_send: (event) => ({
      ...event,
      properties: sanitizeUrlProperties(event.properties),
      ...(event.$set ? { $set: sanitizeUrlProperties(event.$set) } : {}),
      ...(event.$set_once
        ? { $set_once: sanitizeUrlProperties(event.$set_once) }
        : {}),
    }),
    capture_exceptions: {
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
      capture_console_errors: false,
    },
    defaults: "2026-08-30",
  });
}

export default posthog;

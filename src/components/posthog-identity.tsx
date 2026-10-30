import { useEffect, useRef } from "react";
import { useStore } from "@/hooks/use-store";
import posthog from "@/lib/posthog";

/** Keep browser analytics identity aligned with the hydrated auth store. */
export function PostHogIdentity() {
  const { auth, user, hydrated } = useStore();
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!posthog.__loaded || !hydrated) return;

    const previousUserId = posthog.get_property("$user_id");
    if (!auth) {
      if (identifiedUserId.current || previousUserId) posthog.reset();
      identifiedUserId.current = null;
      return;
    }

    const userId = user?._id;
    if (!userId || identifiedUserId.current === userId) return;

    if (previousUserId && previousUserId !== userId) posthog.reset();
    const name =
      user.nickname ||
      [user.first_name, user.last_name].filter(Boolean).join(" ");
    posthog.identify(userId, {
      email: user.email,
      ...(name ? { name } : {}),
    });
    identifiedUserId.current = userId;
  }, [auth, user, hydrated]);

  return null;
}

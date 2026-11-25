import { placeholderAuth } from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";
import type { EveChannel } from "eve/channels/eve";

import { accessCookieAuth } from "../lib/access";
import { saveSessionOwner } from "../lib/private-store";
import { recordSessionBeforeReply } from "../lib/session-registration";

const authenticate = accessCookieAuth();
const channel = eveChannel({
  auth: [authenticate, placeholderAuth()],
  uploadPolicy: "disabled",
});

export default {
  ...channel,
  routes: channel.routes.map((route) => {
    if (
      route.transport === "websocket" ||
      route.method !== "POST" ||
      route.path !== "/eve/v1/session"
    ) {
      return route;
    }
    return {
      ...route,
      async handler(request, args) {
        const caller = await authenticate(request);
        const response = await route.handler(request, args);
        if (
          caller === null ||
          caller === undefined ||
          !(response instanceof Response)
        ) {
          return response;
        }
        return await recordSessionBeforeReply(
          response,
          caller.principalId,
          saveSessionOwner
        );
      },
    };
  }),
} satisfies EveChannel;

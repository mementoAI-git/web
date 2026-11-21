import { defineHook } from "eve/hooks";

import { saveSessionOwner } from "../lib/private-store";

export default defineHook({
  events: {
    async "session.started"(_event, ctx) {
      const principal = ctx.session.auth.initiator?.principalId;
      if (principal === undefined || principal === "") {
        throw new Error("Sandbox sessions require a signed-in tester.");
      }
      await saveSessionOwner(ctx.session.id, principal);
    },
  },
});

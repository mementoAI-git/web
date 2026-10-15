import { defineDynamic } from "eve";
import { defineInstructions } from "eve/instructions";

import { readOwnedCredential } from "../lib/memory-context";

export default defineDynamic({
  events: {
    async "turn.started"(_event, ctx) {
      const credential = await readOwnedCredential(
        ctx.session.id,
        ctx.session.auth.current?.principalId
      );
      return defineInstructions({
        content: credential
          ? "ACCOUNT CONNECTION: The current authenticated browser is connected to its Memento account. You can read its profile and recent memories with get_personal_context, and search its memories with search_memories. For personal questions, perform the appropriate lookup before claiming that you lack access or information. Connection alone does not mean all facts have already been loaded. Do not fetch personal data merely for greetings. Never send private context to public web search."
          : "ACCOUNT CONNECTION: This browser has no connected Memento account. Memory tools use fictional Alex samples. Do not present sample facts as the person's own. Explain account connection when they ask for personal information.",
      });
    },
  },
});

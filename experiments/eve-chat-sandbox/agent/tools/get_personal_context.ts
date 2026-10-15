import { defineTool } from "eve/tools";
import { z } from "zod";

import { memoryContext } from "../lib/memory-context";
import { getPersonalContext } from "../lib/personal-context";

export default defineTool({
  description:
    "Read the connected person's profile, communication preferences, and a small recent-memory snapshot. Use for questions about their name, preferences, identity, or what you know about them. The server selects the authenticated account. No user ID or token input is accepted. Not a complete history; use search_memories for specific topics. Never call this merely for greetings or to show off memory.",
  inputSchema: z.object({}),
  label: { start: () => "Reading your Memento context" },
  async execute(_input, ctx) {
    const credential = await memoryContext(ctx);
    return credential
      ? await getPersonalContext(credential.accessToken)
      : {
          mode: "sample",
          profile: null,
          memories: [],
          profileAvailable: false,
          memoryOverviewAvailable: false,
          note: "This browser has no connected Memento account. Only fictional sample-memory tools are available. Explain how to connect if the person asks about themselves.",
        };
  },
});

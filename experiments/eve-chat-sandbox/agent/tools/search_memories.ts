import { defineTool } from "eve/tools";
import { z } from "zod";

import { sampleSearch, searchPersonalMemories } from "../lib/memories";
import { memoryContext } from "../lib/memory-context";

export default defineTool({
  description:
    "Search the signed-in person's stored memories. With no Memento connection, searches explicitly fictional sample memories for Alex. Returns source IDs, titles, dates, bounded excerpts, and source links. Use for questions about personal history, preferences, or experiences. Never claim sample memories are the user's own. No writes are available.",
  inputSchema: z.object({ query: z.string().trim().min(1).max(200) }),
  label: { start: () => "Searching memories" },
  async execute({ query }, ctx) {
    const credential = await memoryContext(ctx);
    const memories = credential
      ? await searchPersonalMemories(credential.accessToken, query)
      : sampleSearch(query);
    let note =
      "Fictional sample memories for Alex, not the current person's memories.";
    if (credential) {
      note = "Personal memories from the authenticated Memento account.";
    }
    if (memories.length === 0) {
      note = "No matching memories. Do not invent personal facts.";
    }
    return { mode: credential ? "memento" : "sample", memories, note };
  },
});

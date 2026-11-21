import { defineTool } from "eve/tools";
import { z } from "zod";

import { getPersonalMemory, sampleGet } from "../lib/memories";
import { memoryContext } from "../lib/memory-context";

export default defineTool({
  description:
    "Read a bounded excerpt of one memory returned by search_memories. Reads only through the signed-in account's existing access checks, or the fictional sample collection when disconnected. This cannot create, edit, delete, or share a memory.",
  inputSchema: z.object({ id: z.string().min(1).max(100) }),
  label: { start: () => "Reading a memory" },
  async execute({ id }, ctx) {
    const credential = await memoryContext(ctx);
    const memory = credential
      ? await getPersonalMemory(credential.accessToken, id)
      : sampleGet(id);
    return {
      mode: credential ? "memento" : "sample",
      memories: memory ? [memory] : [],
      note: memory
        ? "Cite this source; the excerpt may omit parts of the original."
        : "No accessible memory with that ID. Do not invent its contents.",
    };
  },
});

import { defineTool } from "eve/tools";
import { z } from "zod";

import { researchWeb } from "../lib/web-research";

export default defineTool({
  description:
    "Search current public web information through OpenRouter. Send only a public search query, never private memory excerpts, credentials, or sensitive personal details. Returns source links or an explicit unavailable result.",
  inputSchema: z.object({ query: z.string().trim().min(1).max(300) }),
  label: { start: () => "Researching the web" },
  execute: async ({ query }) => await researchWeb(query),
});

import { defineAgent } from "eve";

import { createChatModel } from "./lib/chat-model";

export default defineAgent({
  defaultTools: false,
  limits: {
    maxInputTokensPerSession: 300_000,
  },
  model: createChatModel(),
  reasoning: "none",
});

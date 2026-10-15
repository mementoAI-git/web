import { createDeepSeek } from "@ai-sdk/deepseek";

/** Creates the sandbox’s direct, tool-capable DeepSeek model.
 * @param settings - Server credential and optional test transport.
 * @returns A provider model that bypasses AI Gateway.
 */
export function createChatModel(
  settings: Parameters<typeof createDeepSeek>[0] = {}
) {
  return createDeepSeek(settings)("deepseek-flash");
}

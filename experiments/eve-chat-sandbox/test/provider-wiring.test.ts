import assert from "node:assert/strict";
import { test } from "node:test";

import { generateText, stepCountIs, streamText, tool } from "ai";
import { z } from "zod";

import { createChatModel } from "../agent/lib/chat-model.ts";
import { researchWeb } from "../agent/lib/web-research.ts";

const requestSchema = z.object({
  model: z.string(),
  messages: z.array(z.looseObject({ role: z.string(), content: z.unknown() })),
  plugins: z
    .array(
      z.object({ id: z.string(), engine: z.string(), max_results: z.number() })
    )
    .optional(),
});

for (const streaming of [false, true]) {
  void test(`direct DeepSeek preserves tool calls and reasoning (${streaming ? "stream" : "generate"})`, async () => {
    const requests: { url: string; body: z.infer<typeof requestSchema> }[] = [];
    const model = createChatModel({
      apiKey: "test-only",
      fetch: async (url, init) => {
        requests.push({
          url: z.string().parse(url),
          body: requestSchema.parse(JSON.parse(z.string().parse(init?.body))),
        });
        const message =
          requests.length === 1
            ? {
                role: "assistant",
                content: null,
                reasoning_content: "I should search the memories.",
                tool_calls: [
                  {
                    id: "call_memory",
                    type: "function",
                    function: {
                      name: "search_memories",
                      arguments: '{"query":"gardening"}',
                    },
                  },
                ],
              }
            : {
                role: "assistant",
                content: "Alex's fictional memory describes gardening.",
              };
        if (streaming) {
          const delta = {
            ...message,
            tool_calls: message.tool_calls?.map((call, index) => ({
              ...call,
              index,
            })),
          };
          const payload = {
            id: "test-completion",
            created: 1,
            model: "deepseek-flash",
            choices: [
              {
                index: 0,
                delta,
                finish_reason: requests.length === 1 ? "tool_calls" : "stop",
              },
            ],
            usage: {
              prompt_tokens: 10,
              completion_tokens: 5,
              total_tokens: 15,
            },
          };
          return new Response(
            `data: ${JSON.stringify(payload)}\n\ndata: [DONE]\n\n`,
            { headers: { "Content-Type": "text/event-stream" } }
          );
        }
        return Response.json({
          id: "test-completion",
          created: 1,
          model: "deepseek-flash",
          choices: [
            {
              index: 0,
              message,
              finish_reason: requests.length === 1 ? "tool_calls" : "stop",
            },
          ],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        });
      },
    });
    const options = {
      model,
      prompt: "Find Alex's gardening memory.",
      tools: {
        search_memories: tool({
          inputSchema: z.object({ query: z.string() }),
          execute: ({ query }) => ({ query, title: "Mum's garden" }),
        }),
      },
      stopWhen: stepCountIs(2),
    };
    const result = streaming
      ? streamText(options)
      : await generateText(options);
    const answer = await result.text;
    assert.equal(model.provider, "deepseek.chat");
    assert.equal(requests.length, 2);
    assert.ok(
      requests.every(
        ({ url }) => url === "https://api.deepseek.com/chat/completions"
      )
    );
    assert.equal(requests[0]?.body.model, "deepseek-flash");
    assert.match(JSON.stringify(requests[1]?.body.messages), /call_memory/u);
    assert.match(
      JSON.stringify(requests[1]?.body.messages),
      /I should search the memories/u
    );
    assert.match(JSON.stringify(requests[1]?.body.messages), /Mum's garden/u);
    assert.match(answer, /fictional/u);
  });
}

void test("web research sends only the public query and returns bounded cited sources", async () => {
  const requests: z.infer<typeof requestSchema>[] = [];
  const result = await researchWeb("Lisbon travel advice", {
    apiKey: "test-only",
    model: "configured-search-model",
    fetch: async (url, init) => {
      assert.equal(url, "https://openrouter.ai/api/v1/chat/completions");
      requests.push(
        requestSchema.parse(JSON.parse(z.string().parse(init?.body)))
      );
      return Response.json({
        choices: [
          {
            message: {
              content: "Public research",
              annotations: [
                {
                  type: "url_citation",
                  url_citation: {
                    url: "https://example.com/advice",
                    title: "Travel advice",
                    content: "x".repeat(2000),
                  },
                },
                {
                  type: "url_citation",
                  url_citation: { url: "data:text/plain,bad", title: "Bad" },
                },
              ],
            },
          },
        ],
      });
    },
  });
  const [sent] = requests;
  assert.notEqual(sent, undefined);
  if (sent === undefined) {
    throw new Error("No search request");
  }
  assert.equal(sent.model, "configured-search-model");
  assert.deepEqual(sent.plugins, [
    { id: "web", engine: "exa", max_results: 3 },
  ]);
  assert.equal(sent.messages[1]?.content, "Lisbon travel advice");
  assert.equal(sent.messages.length, 2);
  assert.equal(result.available, true);
  assert.equal(result.sources?.length, 1);
  assert.equal(result.sources?.[0]?.excerpt?.length, 1000);
});

void test("failed, uncited, and missing-key searches do not masquerade as research", async () => {
  const missing = await researchWeb("test", { apiKey: "" });
  assert.equal(missing.available, false);
  const failed = await researchWeb("test", {
    apiKey: "test",
    fetch: async () => new Response("private provider error", { status: 402 }),
  });
  assert.equal(failed.available, false);
  assert.doesNotMatch(JSON.stringify(failed), /private provider error/u);
  const uncited = await researchWeb("test", {
    apiKey: "test",
    fetch: async () =>
      Response.json({
        choices: [{ message: { content: "Unverified", annotations: [] } }],
      }),
  });
  assert.equal(uncited.available, false);
});

void test("non-thinking chat explicitly disables thinking at the direct provider", async () => {
  const bodies: unknown[] = [];
  const model = createChatModel({
    apiKey: "test-only",
    fetch: async (_url, init) => {
      bodies.push(JSON.parse(z.string().parse(init?.body)));
      return Response.json({
        id: "test-fast",
        created: 1,
        model: "deepseek-flash",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Hey!" },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 },
      });
    },
  });
  const result = await generateText({
    model,
    reasoning: "none",
    prompt: "Hey",
  });
  const request = z
    .object({ thinking: z.object({ type: z.literal("disabled") }) })
    .parse(bodies[0]);
  assert.equal(request.thinking.type, "disabled");
  assert.equal(result.text, "Hey!");
});

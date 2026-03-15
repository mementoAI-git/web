import { http, HttpResponse } from "msw";
import { mockUser } from "../fixtures";

const BASE_URL = "http://localhost:3000/api";

export const handlers = [
  http.get(`${BASE_URL}/users/profile`, () => {
    return HttpResponse.json({
      success: true,
      data: mockUser,
      message: "Profile fetched successfully",
    });
  }),

  http.get(`${BASE_URL}/users/context`, () => {
    return HttpResponse.json({
      success: true,
      data: mockUser.context || {},
      message: "User context fetched",
    });
  }),

  http.get(`${BASE_URL}/users/stats`, () => {
    return HttpResponse.json({
      success: true,
      data: { streak: 5, total_memories: 12, total_stories: 3 },
    });
  }),

  http.get(`${BASE_URL}/activities`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        docs: [
          {
            _id: "act-1",
            description: "What are your thoughts on the...",
            created_at: new Date().toISOString(),
            type: "chat",
          },
          {
            _id: "act-2",
            description: "My trip to the United States ba...",
            created_at: new Date(Date.now() - 172800000).toISOString(),
            type: "story",
          },
          {
            _id: "act-3",
            description: "How do I make a paper plane...",
            created_at: new Date(Date.now() - 172800000).toISOString(),
            type: "prompt",
          },
          {
            _id: "act-4",
            description: 'The one time i "woke up"',
            created_at: new Date(Date.now() - 172800000).toISOString(),
            type: "memo",
          },
        ],
      },
      message: "Activities fetched",
    });
  }),

  http.get(`${BASE_URL}/memories/conversations`, () => {
    return HttpResponse.json({
      success: true,
      data: [],
      message: "Conversations fetched",
    });
  }),

  http.get(`${BASE_URL}/memories`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        docs: [
          {
            _id: "mem-1",
            title: "Family reunion, Lagos 1990",
            attachments: [{ type: "image/jpeg", duration: undefined, _id: "f1", name: "photo.jpg", size: 0, url: "" }],
            beneficiaries: [{ _id: "b1", name: "Alice" }, { _id: "b2", name: "Bob" }, { _id: "b3", name: "Carol" }, { _id: "b4", name: "Dave" }],
            groups: [],
            created_at: new Date().toISOString(),
          },
          {
            _id: "mem-2",
            title: "Wedding anniversary message",
            attachments: [{ type: "video/mp4", duration: 154, _id: "f2", name: "video.mp4", size: 0, url: "" }],
            beneficiaries: [],
            groups: [],
            created_at: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            _id: "mem-3",
            title: "Jollof rice recipe",
            attachments: [{ type: "application/pdf", _id: "f3", name: "doc.pdf", size: 0, url: "" }],
            beneficiaries: [{ _id: "b1", name: "Alice" }, { _id: "b2", name: "Bob" }, { _id: "b3", name: "Carol" }],
            groups: [],
            created_at: new Date(Date.now() - 172800000).toISOString(),
          },
          {
            _id: "mem-4",
            title: "Favourite hymn recording",
            attachments: [{ type: "audio/mpeg", duration: 252, _id: "f4", name: "audio.mp3", size: 0, url: "" }],
            beneficiaries: [{ _id: "b1", name: "Alice" }, { _id: "b2", name: "Bob" }],
            groups: [],
            created_at: new Date(Date.now() - 259200000).toISOString(),
          },
        ],
        totalDocs: 4,
        hasNextPage: false,
        page: 1,
      },
      message: "Memories fetched",
    });
  }),

  http.get(`${BASE_URL}/prompts`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          prompt: {
            _id: "prompt-1",
            title:
              "Think of a recent happy memory with your family. What happened and why is it meaningful?",
            answered: false,
          },
        },
        {
          prompt: {
            _id: "prompt-2",
            title: "What's one thing you're grateful for today?",
            answered: false,
          },
        },
      ],
      message: "Prompts fetched",
    });
  }),

  http.get(`${BASE_URL}/prompts/suggestions`, () => {
    return HttpResponse.json({
      success: true,
      data: [],
      message: "Suggestions fetched",
    });
  }),

  http.post(`${BASE_URL}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as Record<string, string>;
    if (body.email === "test@example.com" && body.password === "password123") {
      return HttpResponse.json({
        success: true,
        data: {
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          expires_at: new Date(Date.now() + 3600000).toISOString(),
          refresh_expires_at: new Date(Date.now() + 86400000).toISOString(),
        },
      });
    }
    return HttpResponse.json(
      { success: false, message: "Invalid credentials" },
      { status: 401 },
    );
  }),

  http.post(`${BASE_URL}/auth/refresh-token`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        access_token: "refreshed-access-token",
        refresh_token: "refreshed-refresh-token",
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        refresh_expires_at: new Date(Date.now() + 86400000).toISOString(),
      },
    });
  }),

  http.get(`${BASE_URL}/prompts/suggestions/overview`, () => {
    return HttpResponse.json({
      success: true,
      data: [],
      message: "Overview prompts fetched",
    });
  }),

  http.post(`${BASE_URL}/ai/conversation/new`, async ({ request }) => {
    const body = (await request.json()) as { text?: string };
    return HttpResponse.json({
      success: true,
      data: {
        memory_id: "mock-memory-id",
        response: body?.text ? `Reply to: ${body.text}` : "Hello!",
      },
    });
  }),

  // Host onboarding (Groot) - backend not yet implemented, mocked for tests
  http.post(`${BASE_URL}/host/onboarding`, async ({ request }) => {
    await request.json();
    return HttpResponse.json({
      success: true,
      data: { success: true, enrichmentScoreSeed: {} },
    });
  }),
  http.patch(`${BASE_URL}/host/onboarding/progress`, async ({ request }) => {
    await request.json();
    return HttpResponse.json({
      success: true,
      data: { success: true },
    });
  }),
  http.get(`${BASE_URL}/host/profile`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        displayName: "Jane",
        hostArchetype: "family",
        motivationType: "emotional_depth",
        priorityDimensions: ["people_relationships"],
        expressionMode: ["voice"],
      },
    });
  }),
];

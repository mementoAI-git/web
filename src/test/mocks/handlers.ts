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

  http.get(`${BASE_URL}/users/stats`, () => {
    return HttpResponse.json({
      success: true,
      data: { streak: 5, total_memories: 12, total_stories: 3 },
    });
  }),

  http.get(`${BASE_URL}/activities`, () => {
    return HttpResponse.json({
      success: true,
      data: [],
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

  http.post(`${BASE_URL}/ai/conversation/new`, () => {
    return HttpResponse.json({
      success: true,
      data: { memory_id: "mock-memory-id" },
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

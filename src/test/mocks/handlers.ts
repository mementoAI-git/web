import { http, HttpResponse } from "msw";
import { ALL_ENRICHMENT_CATEGORY_KEYS } from "@/features/enrichment/enrichment-categories";
import { mockUser } from "../fixtures";

const BASE_URL = "http://localhost:3000/api";

export const handlers = [
  http.get(`${BASE_URL}/billing/account`, () => HttpResponse.json({
    success: true,
    data: {has_customer: false, email: mockUser.email, name: "Test User", address: null, payment_methods: []},
  })),
  http.get(`${BASE_URL}/billing/subscription`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        tier: "free",
        status: "active",
        features: [],
        usage: {
          storage_used_bytes: 512 * 1024 * 1024,
          beneficiary_count: 0,
          timed_message_count: 0,
        },
      },
    });
  }),

  http.post(`${BASE_URL}/billing/checkout`, () => {
    return HttpResponse.json({
      success: true,
      data: { checkout_url: "https://checkout.test/polar-session" },
    });
  }),

  http.post(`${BASE_URL}/billing/portal`, () => {
    return HttpResponse.json({
      success: true,
      data: { portal_url: "https://billing.test/portal" },
    });
  }),

  http.post(`${BASE_URL}/billing/promo/redeem`, () => {
    return HttpResponse.json({
      success: true,
      data: {},
      message: "Promo applied",
    });
  }),

  http.get(`${BASE_URL}/billing/invoices`, () => {
    return HttpResponse.json({
      success: true,
      data: [],
    });
  }),

  http.get(`${BASE_URL}/capsule/stats`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        scheduled_count: 0,
        delivered_count: 0,
        paused_count: 0,
        draft_count: 0,
      },
    });
  }),

  http.get(`${BASE_URL}/capsule`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        docs: [],
        totalDocs: 0,
        page: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        nextPage: null,
        prevPage: null,
        limit: 20,
      },
    });
  }),

  http.get(`${BASE_URL}/users/profile`, () => {
    return HttpResponse.json({
      success: true,
      data: mockUser,
      message: "Profile fetched successfully",
    });
  }),

  http.put(`${BASE_URL}/users/profile`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: { ...mockUser, ...body },
      message: "Profile updated",
    });
  }),

  http.get(`${BASE_URL}/users/context`, () => {
    return HttpResponse.json({
      success: true,
      data: mockUser.context || {},
      message: "User context fetched",
    });
  }),

  http.get(`${BASE_URL}/users/persona`, () => {
    return HttpResponse.json({
      status: 200,
      message: "Persona retrieved successfully",
      data: null,
    });
  }),

  http.get(`${BASE_URL}/persona/observations`, () => {
    return HttpResponse.json({
      status: 200,
      message: "Observations retrieved successfully",
      data: { observations: [], generating: false },
    });
  }),

  http.get(`${BASE_URL}/users/insights`, () => {
    return HttpResponse.json({
      status: 200,
      message: "Insights retrieved",
      data: {
        insights: [],
        generated_at: null,
        next_refresh_at: null,
        generating: false,
      },
    });
  }),

  http.get(`${BASE_URL}/users/insights/sources`, () => {
    return HttpResponse.json({
      status: 200,
      message: "Insight sources retrieved",
      data: { sources: [] },
    });
  }),

  http.get(`${BASE_URL}/users/persona/memory-insights-summary`, () => {
    return HttpResponse.json({
      status: 200,
      message: "Not enough context for a summary yet",
      data: {
        summary: null,
        generated_at: null,
        cached: false,
      },
    });
  }),

  http.get(`${BASE_URL}/beneficiaries`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        docs: [],
        hasNextPage: false,
        hasPrevPage: false,
        limit: 20,
        nextPage: null,
        page: 1,
        pagingCounter: 0,
        prevPage: null,
        totalDocs: 0,
        totalPages: 0,
      },
    });
  }),

  http.get(`${BASE_URL}/groups`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        docs: [],
        hasNextPage: false,
        hasPrevPage: false,
        limit: 25,
        nextPage: null,
        page: 1,
        pagingCounter: 0,
        prevPage: null,
        totalDocs: 0,
        totalPages: 0,
      },
    });
  }),

  http.get(`${BASE_URL}/users/stats`, () => {
    const category_scores = ALL_ENRICHMENT_CATEGORY_KEYS.map((key, i) => ({
      key,
      label: key
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      score: 8 + (i % 7),
      weight: 0.1,
      itemCount: key === "identity_self" ? 4 : i % 5 === 0 ? 1 : 0,
      unlocked: true,
    }));
    return HttpResponse.json({
      success: true,
      data: {
        streak_count: 5,
        reflections_count: 0,
        stories_count: 3,
        pending_insights_count: 0,
        enrichment_score: 24,
        category_scores,
        lowest_category: "hopes_legacy",
        beneficiary_access_unlocked: true,
        milestone: {
          reached_threshold: 0,
          reached_label: "Start",
          reached_description: "",
          next_threshold: 25,
          next_label: "Growing",
          is_max: false,
        },
        nudge: {
          category_key: "hopes_legacy",
          category_label: "Hopes & legacy",
          question: "What's one hope you'd want someone to remember about you?",
        },
        jump_pills: [
          {
            category_key: "hopes_legacy",
            category_label: "Hopes & legacy",
            starter: "One hope I carry is…",
          },
        ],
        spotlight: null,
      },
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
      data: {
        docs: [
          {
            _id: "host-conversation-1",
            title: "Your Memento",
            updated_at: new Date().toISOString(),
            type: "conversation",
          },
        ],
        hasNextPage: false,
        hasPrevPage: false,
        limit: 20,
        nextPage: null,
        page: 1,
        pagingCounter: 1,
        prevPage: null,
        totalDocs: 1,
        totalPages: 1,
      },
      message: "Conversations fetched",
    });
  }),

  http.get(`${BASE_URL}/memories/:id`, ({ params }) => {
    const id = String(params.id);
    return HttpResponse.json({
      success: true,
      data: {
        _id: id,
        title: "Your Memento",
        body: "",
        user: "mock-user",
        attachments: [],
        tags: [],
        type: "conversation",
        status: "active",
        level: 0,
        refrence: "",
        last_opened: new Date().toISOString(),
        created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
        updated_at: new Date().toISOString(),
      },
      message: "Memory fetched",
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

  http.get(`${BASE_URL}/prompts/shuffle`, () => HttpResponse.json({ data: { used: 0, remaining: 2, limit: 2, resets_at: new Date(Date.now() + 86400000).toISOString() } })),
  http.post(`${BASE_URL}/prompts/shuffle`, () => HttpResponse.json({ data: { used: 1, remaining: 1, limit: 2, allowed: true, resets_at: new Date(Date.now() + 86400000).toISOString() } })),
  http.get(`${BASE_URL}/prompts`, () => {
    const dk = "2026-05-01";
    return HttpResponse.json({
      success: true,
      data: [
        {
          slot_kind: "ai",
          display_label: "Just for you",
          answered: false,
          ai_prompt_text: "What part of your week still feels unfinished when you think about it?",
          reflection_day_key: dk,
        },
        {
          slot_kind: "static",
          answered: false,
          reflection_day_key: dk,
          prompt: {
            _id: "prompt-1",
            title:
              "Think of a recent happy memory with your family. What happened and why is it meaningful?",
            type: "general",
            tags: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        },
        {
          slot_kind: "static",
          answered: false,
          reflection_day_key: dk,
          prompt: {
            _id: "prompt-2",
            title: "What's one thing you're grateful for today?",
            type: "general",
            tags: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
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

  // Onboarding (Groot) — users module
  http.get(`${BASE_URL}/users/onboarding-details`, () => {
    return HttpResponse.json({
      status: 200,
      message: "OK",
      data: {
        onboarding_status: "completed",
        user: {
          first_name: "Jane",
          last_name: "Doe",
          nickname: "Jane",
          full_name: "Jane Doe",
          age_range: "30s_40s",
          location: "London",
          age_bracket: "30s_40s",
          priority_dimensions: ["relationships_people", "memories_experiences"],
          expression_mode: "voice",
          chronotype: "night",
          sharing_intent: "shared_legacy",
          onboarding_step_reached: 12,
          skipped_deep_personalization: false,
        },
        persona: {
          join_reasons: ["memory_preservation", "family_history_heritage"],
          audience: ["children", "partner_spouse"],
          current_priority: ["people_relationships", "memories_stories"],
          communication_style: [],
          prefered_communication_style: "voice",
          motivation: "memory_preservation",
          motivation_detail: "",
          life_situation: "caregiver",
          life_situation_detail: "",
          personality_traits: ["warm_caring", "strong_dependable"],
          memory_treasures: ["quiet_mornings", "family_gatherings"],
        },
      },
    });
  }),
  http.post(`${BASE_URL}/users/onboarding`, async ({ request }) => {
    await request.json();
    return HttpResponse.json({
      status: 200,
      message: "Onboarding saved successfully",
      data: null,
    });
  }),
  http.post(`${BASE_URL}/users/onboarding/skip`, () => {
    return HttpResponse.json({
      status: 200,
      message: "Onboarding skipped",
      data: { onboarding_status: "skipped" },
    });
  }),

  http.post(`${BASE_URL}/ai/tasks/run`, async ({ request }) => {
    const body = (await request.json()) as {
      task?: string;
      context?: { text?: string; dimension?: string };
    };

    if (body.task === "chat.deep_dive_followup") {
      const sourceText = body.context?.text?.trim() || "that";
      const promptTarget =
        sourceText.length > 60 ? `${sourceText.slice(0, 57)}...` : sourceText;

      return HttpResponse.json({
        success: true,
        data: {
          result: {
            dimension: body.context?.dimension || "identity_self",
            question: `What feels most important about ${promptTarget}?`,
            summary: "Suggested a deeper follow-up prompt.",
          },
          summary: "Generated a deep-dive follow-up.",
        },
        message: "ok",
      });
    }

    if (body.task === "assistant.compose_response") {
      const prompt = body.context?.prompt?.trim() || "that memory";

      return HttpResponse.json({
        success: true,
        data: {
          result: {
            text: `I can help with that. Based on what you've written so far, ${prompt.toLowerCase()} sounds like it may carry emotional weight that is worth naming more directly.`,
          },
          summary: "Composed an assistant reply.",
          session_id: "assistant-session-1",
          run_id: "assistant-run-1",
          workflow_id: "conversation-agent",
          tool_calls: ["load-current-assistant-context"],
        },
        message: "ok",
      });
    }

    return HttpResponse.json({
      success: true,
      data: {
        result: {},
      },
      message: "ok",
    });
  }),

  http.post(`${BASE_URL}/files/upload`, () => {
    return HttpResponse.json({
      success: true,
      message: "Uploaded",
      data: {
        _id: "mock-file-id",
        url: "https://example.com/mock-upload.png",
        name: "mock-upload.png",
        size: 128,
        type: "image/png",
      },
    });
  }),

  // 2FA login verification
  http.post(`${BASE_URL}/auth/2fa/verify`, async ({ request }) => {
    const body = (await request.json()) as { two_fa_token?: string; code?: string };
    if (body.code === "000000") {
      return HttpResponse.json({ success: false, message: "Invalid 2FA code" }, { status: 400 });
    }
    return HttpResponse.json({
      success: true,
      message: "Login successful",
      data: {
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        refresh_expires_at: new Date(Date.now() + 86400000).toISOString(),
        onboarding_status: "completed",
        onboarded: true,
      },
    });
  }),

  // Passkey management
  http.get(`${BASE_URL}/users/passkeys`, () => {
    return HttpResponse.json({
      success: true,
      message: "Passkeys retrieved successfully",
      data: [],
    });
  }),

  http.delete(`${BASE_URL}/users/passkeys/:credential_id`, () => {
    return HttpResponse.json({
      success: true,
      message: "Passkey removed successfully",
      data: null,
    });
  }),

  // Passkey login
  http.post(`${BASE_URL}/auth/passkey/login/begin`, () => {
    return HttpResponse.json({
      success: true,
      message: "Authentication options generated",
      data: {
        challenge: "mock-challenge",
        challenge_id: "mock-challenge-id",
        rpId: "localhost",
        allowCredentials: [],
        userVerification: "required",
        timeout: 60000,
      },
    });
  }),

  http.post(`${BASE_URL}/auth/passkey/login/complete`, () => {
    return HttpResponse.json({
      success: true,
      message: "Login successful",
      data: {
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        refresh_expires_at: new Date(Date.now() + 86400000).toISOString(),
        onboarding_status: "completed",
        onboarded: true,
      },
    });
  }),

  // Passkey registration
  http.post(`${BASE_URL}/auth/passkey/register/begin`, () => {
    return HttpResponse.json({
      success: true,
      message: "Registration options generated",
      data: {
        challenge: "mock-reg-challenge",
        rp: { id: "localhost", name: "Memento" },
        user: { id: "user123", name: "test@example.com", displayName: "Test" },
        pubKeyCredParams: [],
        timeout: 60000,
        attestation: "none",
      },
    });
  }),

  http.post(`${BASE_URL}/auth/passkey/register/complete`, () => {
    return HttpResponse.json({
      success: true,
      message: "Passkey registered successfully",
      data: { credential_id: "new-cred-id", device_name: "Test Device" },
    });
  }),
];

import { render, waitFor, screen, fireEvent } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { SWRConfig } from "swr";
import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { fetcher } from "@/api/fetcher";
import { ChatProvider } from "@/hooks/use-chat";
import { ModalProvider } from "@/hooks/use-modal";
import { StoreProvider } from "@/hooks/use-store";
import { server } from "@/test/mocks/server";
import { seedAuth, clearAuth } from "@/test/auth-helpers";
import { mockUser } from "@/test/fixtures";
import { router as appRouter } from "@/router";

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, createBrowserRouter: (routes: unknown) => ({ routes }) };
});

// Keep the real route tree and Chat entry; isolate unrelated page dependencies.
vi.mock("@/App", () => ({ default: () => null }));
vi.mock("@/pages", async () => {
  const { default: ChatLandingPage } = await import("./index");
  const Placeholder = () => null;
  return {
    AcceptInvitePage: Placeholder,
    AiHealthPage: Placeholder,
    BeneficiaryPage: Placeholder,
    ChatLandingPage,
    ChatPage: Placeholder,
    CheckMailPage: Placeholder,
    ConfirmEmailPage: Placeholder,
    TwoFactorPage: Placeholder,
    DashboardLayout: Placeholder,
    ExploreCategoryPage: Placeholder,
    ExplorePage: Placeholder,
    ForgetPasswordPage: Placeholder,
    LoginPage: Placeholder,
    MiscPage: Placeholder,
    NicknamePage: Placeholder,
    OnboardLayout: Placeholder,
    HostOnboardingChatPage: Placeholder,
    OnboardingSummaryPage: Placeholder,
    WelcomePage: Placeholder,
    OnboardPage: Placeholder,
    OverviewPage: Placeholder,
    PostPage: Placeholder,
    RegisterPage: Placeholder,
    ReplyPage: Placeholder,
    SetPasswordPage: Placeholder,
    VerifyEmailPage: Placeholder,
    StoriesPage: Placeholder,
    StoriesDetailsPage: Placeholder,
    SettingsPage: Placeholder,
    PeoplePage: Placeholder,
    AdminFeatureFlagsPage: Placeholder,
    NotFoundPage: Placeholder,
    ErrorPage: Placeholder,
    OAuthCallbackPage: Placeholder,
    PricingPage: Placeholder,
    CapsuleViewPage: Placeholder,
  };
});

vi.mock("sonner", () => ({ toast: { error: vi.fn(() => "request:host-chat"), dismiss: vi.fn() } }));
import { toast } from "sonner";

const BASE = "http://localhost:3000/api";

function renderHostEntry(initialEntry: string | { pathname: string; search: string; state: unknown } = "/chat") {
  seedAuth();
  const router = createMemoryRouter(
    appRouter.routes[0].children!.find(route => !route.path && route.children)!.children!
      .filter(route => route.path?.startsWith("chat"))
      .map(route => route.path === "chat/new" || route.path === "chat/:id" || route.path === "chat/:id/voice"
        ? { id: route.path, path: "/" + route.path, element: <div>Conversation destination</div> }
        : { id: route.path, path: "/" + route.path, element: route.element }),
    { initialEntries: [initialEntry] },
  );
  const result = render(
    <StoreProvider>
      <ModalProvider>
        <ChatProvider>
          <SWRConfig
            value={{
              fetcher,
              dedupingInterval: 0,
              shouldRetryOnError: false,
              provider: () => new Map(),
            }}
          >
            <RouterProvider router={router} />
          </SWRConfig>
        </ChatProvider>
      </ModalProvider>
    </StoreProvider>,
  );
  return { ...result, router };
}

describe("HostChatEntryPage", () => {
  it.each(["/chat/conversations", "/chat/conversations/suggested"])("routes legacy URL %s through the active Host entry", async (url) => {
    server.use(http.get(`${BASE}/users/profile`, () => HttpResponse.json({ data: { ...mockUser, primary_conversation_id: "thread-current" } })));
    const { router } = renderHostEntry(url);
    await waitFor(() => expect(router.state.location.pathname).toBe("/chat/thread-current"));
    expect(screen.queryByText("Recent Conversations")).not.toBeInTheDocument();
  });

  it.each(["thread-recovered", null])("recovers a failed profile request without reloading (%s)", async (primaryId) => {
    let fail = true;
    server.use(http.get(`${BASE}/users/profile`, () => fail
      ? HttpResponse.json({ message: "Internal server error" }, { status: 500 })
      : HttpResponse.json({ data: { ...mockUser, primary_conversation_id: primaryId } })));
    vi.mocked(toast.error).mockClear();
    const { router } = renderHostEntry({ pathname: "/chat", search: "?mode=voice&starter=hello", state: { autoStartVoice: true } });
    const retry = await screen.findByRole("button", { name: "Retry loading conversation" });
    expect(router.state.location.pathname).toBe("/chat");
    expect(screen.queryByText("Internal server error")).not.toBeInTheDocument();
    expect(screen.queryByText("We couldn't load your conversation.")).not.toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledTimes(1);
    fail = false;
    fireEvent.click(retry);
    await waitFor(() => expect(router.state.location.pathname).toBe(`/chat/${primaryId || "new"}`));
    expect(router.state.location.search).toBe("?starter=hello&voice=1");
    expect(router.state.location.state).toEqual({ autoStartVoice: true });
  });

  it.each(["thread-xyz", null])("opens voice mode with primary conversation %s", async (primaryId) => {
    server.use(http.get(`${BASE}/users/profile`, () => HttpResponse.json({
      success: true,
      data: { ...mockUser, primary_conversation_id: primaryId },
    })));
    const { router } = renderHostEntry({ pathname: "/chat", search: "?mode=voice", state: { autoStartVoice: true } });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/chat/${primaryId || "new"}`);
      expect(router.state.location.search).toBe("?voice=1");
      expect(router.state.location.state).toEqual({ autoStartVoice: true });
    });
  });

  it("navigates to the existing conversation when primary_conversation_id is set", async () => {
    server.use(
      http.get(`${BASE}/users/profile`, () =>
        HttpResponse.json({
          success: true,
          data: { ...mockUser, primary_conversation_id: "thread-xyz" },
          message: "Profile fetched successfully",
        }),
      ),
    );

    const { router } = renderHostEntry();

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/chat/thread-xyz");
    });
  });

  it("navigates to /chat/new when no primary_conversation_id exists", async () => {
    server.use(
      http.get(`${BASE}/users/profile`, () =>
        HttpResponse.json({
          success: true,
          data: { ...mockUser, primary_conversation_id: null },
          message: "Profile fetched successfully",
        }),
      ),
    );

    const { router } = renderHostEntry();

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/chat/new");
    });
  });

  it("preserves query string when redirecting to primary conversation", async () => {
    server.use(
      http.get(`${BASE}/users/profile`, () =>
        HttpResponse.json({
          success: true,
          data: { ...mockUser, primary_conversation_id: "thread-xyz" },
          message: "Profile fetched successfully",
        }),
      ),
    );

    const { router } = renderHostEntry("/chat?starter=hello");

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/chat/thread-xyz");
      expect(router.state.location.search).toBe("?starter=hello");
    });
  });

  it("preserves query string when redirecting to new conversation", async () => {
    server.use(
      http.get(`${BASE}/users/profile`, () =>
        HttpResponse.json({
          success: true,
          data: { ...mockUser, primary_conversation_id: null },
          message: "Profile fetched successfully",
        }),
      ),
    );

    const { router } = renderHostEntry("/chat?starter=go");

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/chat/new");
      expect(router.state.location.search).toBe("?starter=go");
    });
  });
});

afterEach(() => {
  clearAuth();
});

import { render, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { SWRConfig } from "swr";
import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { fetcher } from "@/api/fetcher";
import { ChatProvider } from "@/hooks/use-chat";
import { ModalProvider } from "@/hooks/use-modal";
import { StoreProvider } from "@/hooks/use-store";
import { server } from "@/test/mocks/server";
import { seedAuth, clearAuth } from "@/test/auth-helpers";
import HostChatEntryPage from "./host-chat-entry";

const BASE = "http://localhost:3000/api";

function renderHostEntry() {
  seedAuth();
  const router = createMemoryRouter(
    [
      { path: "/chat", element: <HostChatEntryPage /> },
      {
        path: "/chat/:id",
        element: <div data-testid="conversation-open">thread</div>,
      },
    ],
    { initialEntries: ["/chat"] },
  );
  const result = render(
    <StoreProvider>
      <ModalProvider>
        <ChatProvider>
          <SWRConfig
            value={{
              fetcher,
              dedupingInterval: 0,
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
  it("navigates to the first conversation when docs exist", async () => {
    server.use(
      http.get(`${BASE}/memories/conversations`, () =>
        HttpResponse.json({
          success: true,
          data: {
            docs: [{ _id: "thread-xyz", title: "Your Memento" }],
          },
        }),
      ),
    );

    const { router } = renderHostEntry();

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/chat/thread-xyz");
    });
  });

  it("starts a conversation when list is empty", async () => {
    server.use(
      http.get(`${BASE}/memories/conversations`, () =>
        HttpResponse.json({
          success: true,
          data: { docs: [] },
        }),
      ),
    );

    const { router } = renderHostEntry();

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/chat/mock-memory-id");
    });
  });
});

afterEach(() => {
  clearAuth();
});

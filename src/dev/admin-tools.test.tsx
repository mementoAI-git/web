import { useEffect, useState } from "react";
import { render, screen, waitFor, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { SWRConfig } from "swr";
import useSWR from "swr";
import { afterEach, describe, expect, it } from "vitest";
import { StoreProvider, useStore } from "@/hooks/use-store";
import { fetcher, postFetcher } from "@/api/fetcher";
import { mockUser } from "@/test/fixtures";
import HostChatEntryPage from "@/pages/dashboard/chat/main/host-chat-entry";
import { DevAdminProvider } from "./admin-tools";
import { getPreviewSession, setPreviewSession } from "./preview-session";

afterEach(() => {
  cleanup();
  setPreviewSession(null);
});

function Probe() {
  const { user } = useStore();
  const { data: stats } = useSWR("/users/stats");
  const { data: topics } = useSWR("/prompts/suggestions/overview");
  const [count, setCount] = useState(0);
  return (
    <>
      <p>User: {user?.nickname}</p>
      <p>Streak: {user?.streak}</p>
      <p>Stories: {stats?.data?.stories_count}</p>
      <p>Topics: {topics?.data?.length ?? 0}</p>
      <p>Local state: {count}</p>
      <button onClick={() => setCount(count + 1)}>Modify page state</button>
      <button
        onClick={() =>
          void postFetcher("/memories/quick-capture", {
            arg: { body: "Temporary story" },
          })
        }
      >
        Simulate save
      </button>
    </>
  );
}

function SeedUser({ children }: { children: React.ReactNode }) {
  const { setUser } = useStore();
  useEffect(() => {
    setUser({ ...mockUser, primary_conversation_id: "real-thread" });
  }, [setUser]);
  return children;
}

function setup(route = "/") {
  const router = createMemoryRouter(
    [
      { path: "/", element: <Probe /> },
      { path: "/chat", element: <HostChatEntryPage /> },
      { path: "/chat/:id", element: <Probe /> },
    ],
    { initialEntries: [route] },
  );
  render(
    <StoreProvider>
      <SeedUser>
        <SWRConfig
          value={{ fetcher, provider: () => new Map(), dedupingInterval: 0 }}
        >
          <DevAdminProvider router={router}>
            <RouterProvider router={router} />
          </DevAdminProvider>
        </SWRConfig>
      </SeedUser>
    </StoreProvider>,
  );
  return router;
}

async function enable() {
  await userEvent.click(
    screen.getByRole("button", { name: "Dev Admin Tools" }),
  );
  await userEvent.click(
    screen.getByRole("switch", { name: "New user preview" }),
  );
}

describe("local new-user preview provider", () => {
  it("keeps Overview starter content and restores the real profile/cache on exit", async () => {
    setup();
    await screen.findByText("Stories: 3");
    await screen.findByText("Streak: 5");
    await enable();
    await screen.findByText("Stories: 0");
    await screen.findByText("Topics: 7");
    expect(screen.getByText("User: Tester")).toBeInTheDocument();
    expect(screen.getByText("Streak: 0")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Simulate save" }),
    );
    await screen.findByText("Stories: 1");
    await userEvent.click(
      screen.getByRole("switch", { name: "New user preview" }),
    );
    await screen.findByText("Stories: 3");
    expect(screen.getByText("Streak: 5")).toBeInTheDocument();
    expect(getPreviewSession()).toBeNull();
  });

  it("starts fresh on every activation and clears prior component state", async () => {
    setup();
    await screen.findByText("User: Tester");
    await userEvent.click(
      screen.getByRole("button", { name: "Modify page state" }),
    );
    await enable();
    await screen.findByText("Stories: 0");
    expect(screen.getByText("Local state: 0")).toBeInTheDocument();
    const first = getPreviewSession();
    await userEvent.click(
      screen.getByRole("button", { name: "Simulate save" }),
    );
    await screen.findByText("Stories: 1");
    await userEvent.click(
      screen.getByRole("switch", { name: "New user preview" }),
    );
    await userEvent.click(
      screen.getByRole("switch", { name: "New user preview" }),
    );
    await screen.findByText("Stories: 0");
    expect(getPreviewSession()).not.toBe(first);
  });

  it("redirects an existing Chat to its first-use route and restores it on exit", async () => {
    const router = setup("/chat/real-thread");
    await screen.findByText("User: Tester");
    await enable();
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/chat/new"),
    );
    await userEvent.click(
      screen.getByRole("switch", { name: "New user preview" }),
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/chat/real-thread"),
    );
  });

  it("resolves the /chat entry from the temporary profile without getting stuck", async () => {
    const router = setup();
    await screen.findByText("User: Tester");
    await enable();
    await act(() => router.navigate("/chat"));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/chat/new"),
    );
  });
});

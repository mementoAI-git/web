import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, delay } from "msw";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import { mockUser } from "@/test/fixtures";
import { StoreValueProvider, initialStates } from "@/hooks/use-store";
import { ChatSwitcher } from "./chat-switcher";
import { ConnectionChat } from "./connection-chat";
const voice = vi.hoisted(() => ({
  start: vi.fn(),
  end: vi.fn(),
  timeline: [],
  active: false,
  ready: false,
  connectionPersonId: null,
}));
vi.mock("@/contexts/voice-session", () => ({ useVoiceSession: () => voice }));
const person = {
  user_id: "sarah",
  name: "Sarah Mitchell",
  relationship: "Friend",
  avatar_url: null,
  memento_state: "active",
};
function App() {
  return (
    <StoreValueProvider value={{ ...initialStates, user: mockUser }}>
      <div className="navigation-header">
        <ChatSwitcher />
      </div>
      <ConnectionChat personId="sarah" />
    </StoreValueProvider>
  );
}
function setup(active = true, turns: object[] = []) {
  server.use(
    http.get("*/people", () =>
      HttpResponse.json({
        success: true,
        data: {
          connections: [
            { ...person, memento_state: active ? "active" : "private" },
          ],
          pending: [],
        },
      }),
    ),
    http.get("*/people/sarah/settings", () =>
      HttpResponse.json({
        success: true,
        data: { shared_item_count: 14, relationship: "Friend" },
      }),
    ),
    http.get("*/people/sarah/talk", () =>
      HttpResponse.json({ success: true, data: { available: true, turns } }),
    ),
    http.get("*/people/sarah/space", () =>
      HttpResponse.json({
        success: true,
        data: { items: [], total: 0, page: 1, has_next_page: false },
      }),
    ),
  );
}
describe("Connection context in Chat", () => {
  it("waits for history and renders the persisted conversation without flashing onboarding", async () => {
    setup();
    server.use(
      http.get("*/people/sarah/talk", async () => {
        await delay(100);
        return HttpResponse.json({
          success: true,
          data: {
            available: true,
            turns: [
              {
                id: "old",
                role: "ai",
                text: "Your persisted private reply",
                available: true,
                citations: [],
              },
            ],
          },
        });
      }),
    );
    renderWithProviders(<App />, {
      auth: true,
      route: "/chat/my-thread?person=sarah",
    });
    expect(
      await screen.findByText("Loading your conversation…"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Start a conversation with/),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByText("Your persisted private reply"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Ask Sarah Mitchell’s Memento anything…"),
    ).toBeInTheDocument();
  });
  it("separates the pill body from its chevron", async () => {
    setup();
    renderWithProviders(<App />, {
      auth: true,
      route: "/chat/my-thread?person=sarah",
    });
    await userEvent.click(
      await screen.findByRole("button", { name: "About Sarah Mitchell" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Sarah Mitchell" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "Chat spaces" }),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Change Memento" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Chat spaces" }),
    ).toBeInTheDocument();
  });
  it("explains the private-profile limits once, then keeps the existing text and call composer usable", async () => {
    setup(false);
    // A stale available=false response must not turn the composer into a share-only box.
    server.use(
      http.get("*/people/sarah/talk", () =>
        HttpResponse.json({
          success: true,
          data: { available: false, turns: [] },
        }),
      ),
    );
    const view = renderWithProviders(<App />, {
      auth: true,
      route: "/chat/thread?person=sarah",
    });
    expect(
      await screen.findByRole("dialog", {
        name: "Sarah Mitchell’s Memento is still getting started",
      }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "I understand" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(await screen.findByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Voice call" })).toBeEnabled();
    await userEvent.click(screen.getByRole("button", { name: "Voice call" }));
    expect(voice.start).toHaveBeenCalledWith(
      expect.objectContaining({ connectionPersonId: "sarah" }),
    );
    expect(
      screen.queryByText(/What you add is shared/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/isn’t available yet/)).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "About Sarah Mitchell" }),
    ).toHaveLength(1);
    view.unmount();
    renderWithProviders(<App />, {
      auth: true,
      route: "/chat/thread?person=sarah",
    });
    await screen.findByRole("textbox");
    expect(
      screen.queryByRole("button", { name: "I understand" }),
    ).not.toBeInTheDocument();
  });
  it("renders existing shared memories directly in Chat without an overlay", async () => {
    setup();
    server.use(
      http.get("*/people/sarah/space", () =>
        HttpResponse.json({
          success: true,
          data: {
            items: [
              {
                source_id: "trip",
                source_type: "note",
                title: "Our weekend",
                body: "A memory we kept together",
                original_date: "2026-01-01",
                contributor: { user_id: "sarah", name: "Sarah" },
                shared_via: "direct",
                attachments: [],
              },
            ],
            total: 1,
            page: 1,
            has_next_page: false,
          },
        }),
      ),
    );
    renderWithProviders(<App />, {
      auth: true,
      route: "/chat/my-thread?person=sarah",
    });
    await waitFor(() =>
      expect(screen.getByText("A memory we kept together")).toBeInTheDocument(),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Start a conversation with/),
    ).not.toBeInTheDocument();
  });
  it("uses a connection empty state and sends through the private endpoint", async () => {
    setup();
    let payload: unknown;
    server.use(
      http.post("*/people/sarah/items", () =>
        HttpResponse.json({
          success: true,
          data: { source_id: "shared-input" },
        }),
      ),
      http.post("*/people/sarah/talk", async ({ request }) => {
        payload = await request.json();
        return HttpResponse.json({
          success: true,
          data: { id: "reply", role: "ai", text: "Answer", citations: [] },
        });
      }),
    );
    renderWithProviders(<App />, {
      auth: true,
      route: "/chat/my-thread?person=sarah",
    });
    expect(
      await screen.findByText("Start a conversation with Sarah’s Memento"),
    ).toBeInTheDocument();
    await userEvent.type(screen.getByRole("textbox"), "Tell me a story");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() =>
      expect(payload).toMatchObject({
        text: "Tell me a story",
        attachments: [],
        shared_input_id: "shared-input",
        shared_space: true,
      }),
    );
  });
  it("retries only the reply after the information has already been shared", async () => {
    setup();
    let contributions = 0;
    let replies = 0;
    server.use(
      http.post("*/people/sarah/items", () => {
        contributions++;
        return HttpResponse.json({
          success: true,
          data: { source_id: "shared-once" },
        });
      }),
      http.post("*/people/sarah/talk", () => {
        replies++;
        return replies === 1
          ? HttpResponse.json(
              { success: false, message: "Unavailable" },
              { status: 503 },
            )
          : HttpResponse.json({
              success: true,
              data: { id: "reply", role: "ai", text: "Reply", citations: [] },
            });
      }),
    );
    renderWithProviders(<App />, { auth: true });
    await userEvent.type(
      await screen.findByRole("textbox"),
      "Our afternoon by the sea",
    );
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(
      await screen.findByText(/Your information was shared, but/),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Retry message" }),
    );
    await waitFor(() => expect(replies).toBe(2));
    expect(contributions).toBe(1);
  });

  describe("timeline", () => {
    const contributor = { user_id: mockUser._id, name: "Me" };
    const base = { original_date: "2026-01-01", shared_via: "direct", attachments: [] };
    function space(items: unknown[]) {
      server.use(
        http.get("*/people/sarah/space", () =>
          HttpResponse.json({
            success: true,
            data: { items, total: items.length, page: 1, has_next_page: false },
          }),
        ),
      );
    }

    it("shows a shared story as a link to the memory, not its contents", async () => {
      setup();
      space([{ ...base, source_id: "story1", source_type: "story", title: "Our trip", body: "Long private body", contributor, shared_via: "individual_visibility" }]);
      renderWithProviders(<App />, { auth: true, route: "/chat/my-thread?person=sarah" });
      const link = await screen.findByRole("link", { name: /Our trip/ });
      expect(link).toHaveAttribute("href", "/stories/story1");
      expect(link).toHaveTextContent("You shared a memory");
      expect(screen.queryByText("Long private body")).not.toBeInTheDocument();
    });

    describe("memory link image", () => {
      const story = { ...base, source_id: "story1", source_type: "story", title: "Our trip", body: "", contributor };
      const file = { _id: "f1", thumbnail: null, status: "ready" };
      const identicon = "https://api.dicebear.com/10.x/disco/svg?seed=story1";
      async function linkImage(attachments: unknown[]) {
        setup();
        space([{ ...story, attachments }]);
        renderWithProviders(<App />, { auth: true, route: "/chat/my-thread?person=sarah" });
        const link = await screen.findByRole("link", { name: /Our trip/ });
        return link.querySelector("img") as HTMLImageElement;
      }

      it("uses the story's image", async () => {
        const image = await linkImage([{ ...file, type: "image/jpeg", url: "/photo.jpg" }]);
        expect(image).toHaveAttribute("src", "/photo.jpg");
      });

      it("uses a video's thumbnail", async () => {
        const image = await linkImage([{ ...file, type: "video/mp4", url: "/clip.mp4", thumbnail: "/poster.jpg" }]);
        expect(image).toHaveAttribute("src", "/poster.jpg");
      });

      it("falls back to the identicon without a thumbnail", async () => {
        expect(await linkImage([])).toHaveAttribute("src", identicon);
      });

      it("skips media that isn't ready", async () => {
        const image = await linkImage([{ ...file, type: "image/jpeg", url: "/photo.jpg", status: "processing" }]);
        expect(image).toHaveAttribute("src", identicon);
      });

      it("falls back to the identicon when the image fails to load", async () => {
        const image = await linkImage([{ ...file, type: "image/jpeg", url: "/broken.jpg" }]);
        fireEvent.error(image);
        await waitFor(() =>
          expect(screen.getByRole("link", { name: /Our trip/ }).querySelector("img")).toHaveAttribute("src", identicon),
        );
      });
    });

    it("shows a sent message as a chat bubble without the old card or header", async () => {
      setup();
      space([{ ...base, source_id: "note1", source_type: "note", title: "Hi Dad", body: "Hi Dad", contributor }]);
      renderWithProviders(<App />, { auth: true, route: "/chat/my-thread?person=sarah" });
      await waitFor(() =>
        expect(screen.getByText("Hi Dad").closest(".sky-card")).toHaveClass("bg-fill-chat-user"),
      );
      expect(screen.queryByText(/added a note/)).not.toBeInTheDocument();
      expect(screen.queryByText("Shared memories")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Add memory" })).not.toBeInTheDocument();
      expect(screen.queryByRole("group", { name: "Filter shared memories" })).not.toBeInTheDocument();
    });

    it("does not repeat a message whose title was taken from its text", async () => {
      setup();
      space([{ ...base, source_id: "note3", source_type: "note", title: "Remember the house?", body: "<p>Remember the house?</p>", contributor }]);
      renderWithProviders(<App />, { auth: true, route: "/chat/my-thread?person=sarah" });
      await waitFor(() => expect(screen.getAllByText("Remember the house?")).toHaveLength(1));
    });

    it("hides the placeholder text on attachment-only messages", async () => {
      setup();
      space([{ ...base, source_id: "photo1", source_type: "photo", title: "Shared attachment", body: "Shared an attachment", contributor, attachments: [{ _id: "f1", type: "image/jpeg", url: "/f1.jpg", thumbnail: null, status: "ready" }] }]);
      renderWithProviders(<App />, { auth: true, route: "/chat/my-thread?person=sarah" });
      expect(await screen.findByTestId("chat-media-group")).toBeInTheDocument();
      expect(screen.queryByText("Shared an attachment")).not.toBeInTheDocument();
    });

    it("labels the other person's message", async () => {
      setup();
      space([{ ...base, source_id: "note2", source_type: "note", title: "Hello", body: "Hello", contributor: { user_id: "sarah", name: "Sarah" } }]);
      renderWithProviders(<App />, { auth: true, route: "/chat/my-thread?person=sarah" });
      await waitFor(() =>
        expect(screen.getByText("Hello").closest(".chat-reply-surface")).toBeInTheDocument(),
      );
      expect(screen.getByText("Sarah")).toBeInTheDocument();
    });
  });

  it("interleaves shared memories and AI replies in chronological order", async () => {
    setup(true, [
      {
        id: "reply",
        role: "ai",
        text: "Middle reflection",
        created_at: "2026-02-02",
        available: true,
        citations: [],
      },
    ]);
    const item = {
      source_type: "note",
      contributor: { user_id: "sarah", name: "Sarah" },
      shared_via: "direct",
      attachments: [],
    };
    server.use(
      http.get("*/people/sarah/space", () =>
        HttpResponse.json({
          success: true,
          data: {
            items: [
              {
                ...item,
                source_id: "new",
                title: "New",
                body: "Latest shared memory",
                original_date: "2026-02-03",
              },
              {
                ...item,
                source_id: "old",
                title: "Old",
                body: "Earlier shared memory",
                original_date: "2026-02-01",
              },
            ],
            total: 2,
            page: 1,
            has_next_page: false,
          },
        }),
      ),
    );
    renderWithProviders(<App />, { auth: true });
    const timeline = await screen.findByRole("list", {
      name: "Connection conversation and shared memories",
    });
    const content = timeline.textContent || "";
    expect(content.indexOf("Earlier shared memory")).toBeLessThan(
      content.indexOf("Middle reflection"),
    );
    expect(content.indexOf("Middle reflection")).toBeLessThan(
      content.indexOf("Latest shared memory"),
    );
  });
});

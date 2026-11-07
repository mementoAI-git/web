import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { server } from "@/test/mocks/server";
import Bubble from "./bubble";
import { useModal } from "@/hooks/use-modal";
import { collectReplySources, parseMementoLink, splitConfirmations } from "./memento-links";

const API = "http://localhost:3000/api";
const LAGOS = "64b7f0c2a1b2c3d4e5f60711";
const CHAT = "64b7f0c2a1b2c3d4e5f60733";

describe("Memento links in chat replies", () => {
  it("recognises in-app story and conversation links, and Memento share links", () => {
    expect(parseMementoLink(`/stories/${LAGOS}`)).toEqual({ kind: "story", id: LAGOS, to: `/stories/${LAGOS}` });
    expect(parseMementoLink(`/chat/${CHAT}`)).toEqual({ kind: "conversation", id: CHAT, to: `/chat/${CHAT}` });
    expect(parseMementoLink(`https://mymemento.io/post/${LAGOS}`)).toMatchObject({ kind: "share", id: LAGOS });
  });

  it("does not treat other sites' /post links as Memento share links", () => {
    expect(parseMementoLink(`https://mymemento.io.evil.com/post/${LAGOS}`)).toBeNull();
    expect(parseMementoLink(`https://example.com/post/${LAGOS}`)).toBeNull();
    expect(parseMementoLink("/stories/not-an-id")).toBeNull();
  });

  it("lists each linked memory once as a source", () => {
    const text = `[Lagos](/stories/${LAGOS}) and again [Lagos trip](/stories/${LAGOS}), [chat](/chat/${CHAT}), [web](https://example.com)`;
    expect(collectReplySources(text).map((source) => source.id)).toEqual([LAGOS, CHAT]);
  });

  it("shows a linked story as a chip that opens it, with a Sources row", () => {
    renderWithProviders(<Bubble role="ai" text={`You wrote about it in [Trip to Lagos](/stories/${LAGOS}).`} />, { auth: true });
    expect(screen.getByRole("link", { name: "Open story: Trip to Lagos" })).toHaveAttribute("href", `/stories/${LAGOS}`);
    const sources = screen.getByRole("navigation", { name: "Sources" });
    expect(sources).toHaveTextContent("Trip to Lagos");
  });

  it("renders a list as a list", () => {
    renderWithProviders(<Bubble role="ai" text={"Here:\n\n- One\n- Two"} />, { auth: true });
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("shows a share link as a preview card with the story's title and cover", async () => {
    server.use(
      http.get(`${API}/memories/public/${LAGOS}`, () =>
        HttpResponse.json({
          success: true,
          data: {
            _id: LAGOS,
            title: "Trip to Lagos",
            body: "<p>We landed at night.</p>",
            tags: [],
            created_at: "2026-10-01T00:00:00.000Z",
            attachments: [{ _id: "f1", name: "a.jpg", type: "image/jpeg", url: "https://cdn.example.com/a.jpg", size: 1 }],
          },
        }),
      ),
    );
    renderWithProviders(<Bubble role="ai" text={`Here it is:\n\nhttps://mymemento.io/post/${LAGOS}`} />, { auth: true });
    const card = await screen.findByRole("link", { name: "Open shared story: Trip to Lagos" });
    expect(card).toHaveAttribute("href", `https://mymemento.io/post/${LAGOS}`);
    expect(card).toHaveTextContent("We landed at night.");
    expect(card.querySelector("img")).toHaveAttribute("src", "https://cdn.example.com/a.jpg");
  });

  it("falls back to the plain link when the story is not public", async () => {
    server.use(http.get(`${API}/memories/public/${LAGOS}`, () => HttpResponse.json({ success: false }, { status: 404 })));
    renderWithProviders(<Bubble role="ai" text={`https://mymemento.io/post/${LAGOS}`} />, { auth: true });
    expect(await screen.findByRole("link", { name: `https://mymemento.io/post/${LAGOS}` })).toBeInTheDocument();
  });

  describe("confirmation cards", () => {
    const card = { tool: "delete_story", memory: CHAT, args: { query: "Lagos", confirmation: "ABCDEFGH" }, text: 'Delete the story "Trip to Lagos".' };
    const reply = (kind = "memento-confirm") => `Want me to delete it?\n\n\`\`\`${kind}\n${JSON.stringify(card)}\n\`\`\``;

    it("takes cards out of the reply's words, and hides one still typing out", () => {
      expect(splitConfirmations(reply())).toEqual({ text: "Want me to delete it?", cards: [{ ...card, confirmed: false }], dones: [] });
      expect(splitConfirmations(reply("memento-confirmed")).cards[0].confirmed).toBe(true);
      expect(splitConfirmations('Sure.\n\n```memento-confirm\n{"tool":"del').text).toBe("Sure.");
      expect(splitConfirmations("```memento-confirm\nnot json\n```").cards).toEqual([]);
    });

    it("shows the card with buttons, never the raw JSON, and runs it on Confirm", async () => {
      let body: unknown;
      server.use(
        http.post(`${API}/ai/chat/actions/delete_story`, async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({ success: true, data: { done: true, text: 'Done: deleted the story "Trip to Lagos".', effects: [{ type: "refresh", what: "memories" }] } });
        }),
      );
      renderWithProviders(<Bubble role="ai" text={reply()} />, { auth: true });
      expect(screen.getByText("Want me to delete it?")).toBeVisible();
      expect(screen.queryByText(/confirmation/)).not.toBeInTheDocument();
      expect(screen.getByRole("group", { name: "Confirm this action" })).toHaveTextContent('Delete the story "Trip to Lagos".');

      await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

      expect(await screen.findByRole("status")).toHaveTextContent('Done: deleted the story "Trip to Lagos".');
      expect(body).toEqual({ memory: CHAT, args: card.args });
      expect(screen.queryByRole("button", { name: "Confirm" })).not.toBeInTheDocument();
    });

    it("does nothing on Cancel", async () => {
      let called = false;
      server.use(http.post(`${API}/ai/chat/actions/delete_story`, () => { called = true; return HttpResponse.json({}); }));
      renderWithProviders(<Bubble role="ai" text={reply()} />, { auth: true });
      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(screen.getByRole("status")).toHaveTextContent("Cancelled. Nothing was changed.");
      expect(called).toBe(false);
    });

    it("says when a confirmation has expired", async () => {
      server.use(
        http.post(`${API}/ai/chat/actions/delete_story`, () =>
          HttpResponse.json({ success: false, message: "This confirmation has expired. Ask Memento again in the chat." }, { status: 409 }),
        ),
      );
      renderWithProviders(<Bubble role="ai" text={reply()} />, { auth: true });
      await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
      expect(await screen.findByRole("status")).toHaveTextContent("This confirmation has expired");
    });

    it("shows a confirmed card as done, without buttons", () => {
      renderWithProviders(<Bubble role="ai" text={reply("memento-confirmed")} />, { auth: true });
      expect(screen.getByRole("status")).toHaveTextContent("Done.");
      expect(screen.queryByRole("button", { name: "Confirm" })).not.toBeInTheDocument();
    });
  });
});

describe("story and link card art", () => {
  it("falls back to the story's Dicebear art when it has no picture", async () => {
    server.use(http.get(`${API}/memories/${LAGOS}`, () => HttpResponse.json({ data: { _id: LAGOS, title: "Trip to Lagos", attachments: [] } })));
    const { container } = renderWithProviders(<Bubble role="ai" text={`Your first story was [Trip to Lagos](/stories/${LAGOS}).`} />, { auth: true });
    await screen.findAllByText("Trip to Lagos");
    const art = container.querySelector('nav[aria-label="Sources"] img');
    expect(art).toHaveAttribute("src", `https://api.dicebear.com/10.x/disco/svg?seed=${LAGOS}`);
  });

  it("shows a shared link's preview image from its page", async () => {
    server.use(http.get(`${API}/ai/link-preview`, ({ request }) => {
      const url = new URL(request.url).searchParams.get("url");
      return HttpResponse.json({ data: { url, domain: "0xgroot.xyz", title: "Groot's site", image: "https://0xgroot.xyz/og.png" } });
    }));
    const { container } = renderWithProviders(<Bubble role="user" text="Can you see this? https://0xgroot.xyz" />, { auth: true });
    expect(await screen.findByRole("link", { name: "Open Groot's site" })).toHaveAttribute("href", "https://0xgroot.xyz");
    expect(container.querySelector('img[src="https://0xgroot.xyz/og.png"]')).toBeInTheDocument();
  });
});

describe("story cards under replies", () => {
  function OpenModals() {
    const { state } = useModal();
    return <output data-testid="modals">{state.map((entry) => `${entry.name}:${(entry.props as { memoryId?: string } | null)?.memoryId}`).join(",")}</output>;
  }

  it("keeps the title as plain text when the card is shown underneath", () => {
    renderWithProviders(<Bubble role="ai" text={`Here it is: [Trip to Lagos](/stories/${LAGOS})`} />, { auth: true });
    expect(screen.getByText(/Here it is:/)).not.toContainElement(screen.queryByRole("link", { name: "Trip to Lagos" }));
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("opens the story over the chat instead of leaving it", async () => {
    renderWithProviders(<><Bubble role="ai" text={`Here it is: [Trip to Lagos](/stories/${LAGOS})`} /><OpenModals /></>, { auth: true });
    await userEvent.click(screen.getByRole("link", { name: "Open story: Trip to Lagos" }));
    expect(screen.getByTestId("modals")).toHaveTextContent(`view-memory:${LAGOS}`);
  });
});

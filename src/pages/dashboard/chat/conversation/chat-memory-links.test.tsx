import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { server } from "@/test/mocks/server";
import Bubble from "./bubble";
import { collectReplySources, parseMementoLink } from "./memento-links";

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
});

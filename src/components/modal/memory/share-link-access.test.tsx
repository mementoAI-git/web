import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, server } from "@/test";
import { ShareLinkAccess } from "./share-link-access";

const API = "http://localhost:3000/api";
const story = { _id: "story-1", title: "T", body: "B", status: "save", attachments: [], tags: [] };
const serve = (memory: Record<string, unknown>) =>
  server.use(http.get(`${API}/memories/story-1`, () => HttpResponse.json({ success: true, data: { ...story, ...memory } })));

describe("ShareLinkAccess", () => {
  it("never changes visibility until the owner asks, then saves only visibility", async () => {
    serve({ visibility: "private" });
    const update = vi.fn();
    server.use(http.put(`${API}/memories/story-1`, async ({ request }) => {
      update(await request.json());
      serve({ visibility: "everyone" });
      return HttpResponse.json({ success: true, data: {} });
    }));
    renderWithProviders(<ShareLinkAccess memoryId="story-1" />);
    const action = await screen.findByRole("button", { name: "Make visible to everyone" });
    expect(screen.getByText("This story is private, so only you can open this link.")).toBeVisible();
    expect(update).not.toHaveBeenCalled();
    await userEvent.setup().click(action);
    expect(await screen.findByText("Anyone with this link can read this story.")).toBeVisible();
    expect(update).toHaveBeenCalledExactlyOnceWith({ visibility: "everyone" });
  });

  it("keeps the story private and offers the action again when saving fails", async () => {
    serve({ visibility: "private" });
    server.use(http.put(`${API}/memories/story-1`, () => HttpResponse.json({ success: false, message: "Nope" }, { status: 403 })));
    renderWithProviders(<ShareLinkAccess memoryId="story-1" />);
    await userEvent.setup().click(await screen.findByRole("button", { name: "Make visible to everyone" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Make visible to everyone" })).toBeEnabled());
    expect(screen.queryByText("Anyone with this link can read this story.")).not.toBeInTheDocument();
  });

  it("names the specific people instead of offering to go public", async () => {
    serve({ visibility: "private", beneficiaries: [{ _id: "b1", name: "Ada" }] });
    renderWithProviders(<ShareLinkAccess memoryId="story-1" />);
    expect(await screen.findByText(/Only you and Ada can open this link/)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Make visible to everyone" })).not.toBeInTheDocument();
  });

  it("does not promise a public link for a draft", async () => {
    serve({ visibility: "everyone", status: "draft" });
    renderWithProviders(<ShareLinkAccess memoryId="story-1" />);
    expect(await screen.findByText(/Publish this story before sharing it/)).toBeVisible();
    expect(screen.queryByText("Anyone with this link can read this story.")).not.toBeInTheDocument();
  });
});

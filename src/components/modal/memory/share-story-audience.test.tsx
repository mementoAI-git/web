import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, server } from "@/test";
import { ShareStoryAudience } from "./share-story-audience";

const API = "http://localhost:3000/api";
const story = { _id: "story-1", title: "T", body: "B", status: "save", attachments: [], tags: [] };
const serve = (memory: Record<string, unknown>) =>
  server.use(
    http.get(`${API}/memories/story-1`, () =>
      HttpResponse.json({ success: true, data: { ...story, ...memory } }),
    ),
    http.get(`${API}/groups`, () =>
      HttpResponse.json({ success: true, data: { docs: [] } }),
    ),
    http.get(`${API}/beneficiaries`, () =>
      HttpResponse.json({ success: true, data: { docs: [] } }),
    ),
  );

const update = vi.fn();
const acceptUpdates = () =>
  server.use(
    http.put(`${API}/memories/story-1`, async ({ request }) => {
      update(await request.json());
      return HttpResponse.json({ success: true, data: {} });
    }),
  );

beforeEach(() => update.mockClear());

describe("ShareStoryAudience", () => {
  it("shows the story's saved audience without changing it", async () => {
    serve({ visibility: "private" });
    acceptUpdates();
    renderWithProviders(<ShareStoryAudience memoryId="story-1" />);
    expect(await screen.findByText("Who can see this story?")).toBeVisible();
    expect(screen.getByText("Private — only you")).toBeVisible();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(update).not.toHaveBeenCalled();
  });

  it("saves once when the owner chooses Everyone", async () => {
    serve({ visibility: "private" });
    acceptUpdates();
    const user = userEvent.setup();
    renderWithProviders(<ShareStoryAudience memoryId="story-1" />);
    await user.click(await screen.findByRole("button", { name: "Who can see this story?" }));
    await user.click(await screen.findByRole("option", { name: /Everyone/ }));
    await waitFor(() =>
      expect(update).toHaveBeenCalledExactlyOnceWith({
        visibility: "everyone",
        groups: [],
        beneficiaries: [],
      }),
    );
  });

  it("returns to the saved audience when saving fails", async () => {
    serve({ visibility: "private" });
    server.use(
      http.put(`${API}/memories/story-1`, () =>
        HttpResponse.json({ success: false, message: "Nope" }, { status: 403 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<ShareStoryAudience memoryId="story-1" />);
    await user.click(await screen.findByRole("button", { name: "Who can see this story?" }));
    await user.click(await screen.findByRole("option", { name: /Everyone/ }));
    expect(await screen.findByText("Private — only you")).toBeInTheDocument();
    expect(screen.queryByText("Visible to everyone")).not.toBeInTheDocument();
  });

  it("asks for a draft to be published instead of offering an audience", async () => {
    serve({ visibility: "everyone", status: "draft" });
    renderWithProviders(<ShareStoryAudience memoryId="story-1" />);
    expect(await screen.findByText(/Publish this story before sharing it/)).toBeVisible();
    expect(screen.queryByText("Who can see this story?")).not.toBeInTheDocument();
  });
});

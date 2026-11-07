import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, server } from "@/test";
import MobileStoryDetails from "./mobile-details";

const API = "http://localhost:3000/api";

function renderStory() {
  server.use(http.get(`${API}/memories/story-1`, () => HttpResponse.json({
    success: true,
    data: {
      _id: "story-1", user: "u", type: "story", status: "save", title: "Quick note",
      body: "<p>This is a recording</p>", created_at: "2026-11-04T10:00:00.000Z",
      summary: "The author made a quick note.", topics: ["Recording", "Note"],
      tags: ["family"], attachments: [],
    },
  })));
  renderWithProviders(
    <Routes>
      <Route path="/stories/:id" element={<MobileStoryDetails />} />
    </Routes>,
    { route: "/stories/story-1", auth: true },
  );
}

describe("mobile story view", () => {
  it("uses the mobile app's layout, without the AI summary or topics", async () => {
    renderStory();
    expect(await screen.findByRole("heading", { name: "Quick note" })).toBeVisible();
    expect(screen.getByText("This is a recording")).toBeVisible();
    for (const name of ["Go back", "Edit", "Story actions"]) {
      expect(screen.getByRole("button", { name })).toBeVisible();
    }
    for (const name of ["Edit story", "Discuss", "Close story", "Details"]) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
    expect(screen.queryByText(/The author made a quick note/)).not.toBeInTheDocument();
    expect(screen.queryByText("#Recording")).not.toBeInTheDocument();
    expect(screen.queryByText("family")).not.toBeInTheDocument();
  });

  it("opens the actions sheet and never changes visibility by itself", async () => {
    const update = vi.fn();
    server.use(http.put(`${API}/memories/story-1`, async ({ request }) => {
      update(await request.json());
      return HttpResponse.json({ success: true, data: {} });
    }));
    renderStory();
    fireEvent.click(await screen.findByRole("button", { name: "Story actions" }));
    expect(await screen.findByRole("heading", { name: "Actions" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Share now" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Add bookmark" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Delete story" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Delete story" }));
    expect(await screen.findByRole("button", { name: "Yes, delete" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    fireEvent.click(await screen.findByRole("button", { name: "Close actions" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Actions" })).not.toBeInTheDocument());
    expect(update).not.toHaveBeenCalled();
  });

  it("saves only tags when they change", async () => {
    const update = vi.fn();
    server.use(http.put(`${API}/memories/story-1`, async ({ request }) => {
      update(await request.json());
      return HttpResponse.json({ success: true, data: {} });
    }));
    renderStory();
    fireEvent.click(await screen.findByRole("button", { name: "Story actions" }));
    fireEvent.click(await screen.findByRole("button", { name: "Remove family" }));
    fireEvent.click(screen.getByRole("button", { name: "Close actions" }));
    await waitFor(() => expect(update).toHaveBeenCalledExactlyOnceWith({ tags: [] }));
  });
});

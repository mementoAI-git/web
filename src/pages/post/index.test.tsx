import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, server } from "@/test";
import { PostPage } from "./index";

const API = "http://localhost:3000/api";

describe("public post page", () => {
  it("retries a temporary failure and makes signup reachable", async () => {
    let failed = true;
    server.use(http.get(`${API}/memories/public/memory-1`, () => failed
      ? HttpResponse.json({}, { status: 503 })
      : HttpResponse.json({ data: { _id: "memory-1", title: "Recovered story", body: "Hello", attachments: [], tags: [] } })));
    renderWithProviders(<Routes><Route path="/post/:id" element={<PostPage />} /></Routes>, { route: "/post/memory-1" });
    const retry = await screen.findByRole("button", { name: "Retry loading story" });
    expect(screen.queryByText("This memory isn’t available")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Join Memento" })).toHaveAttribute("href", "/register");
    failed = false;
    fireEvent.click(retry);
    expect(await screen.findByRole("heading", { name: "Recovered story" })).toBeVisible();
  });

  it("shows an unavailable state for a removed story", async () => {
    server.use(http.get(`${API}/memories/public/memory-1`, () => HttpResponse.json({}, { status: 404 })));
    renderWithProviders(<Routes><Route path="/post/:id" element={<PostPage />} /></Routes>, { route: "/post/memory-1" });
    expect(await screen.findByText("This memory isn’t available")).toBeVisible();
    expect(screen.queryByRole("button", { name: /Retry/ })).not.toBeInTheDocument();
  });

  it("loads the safe public-memory contract without authentication", async () => {
    const privateRoute = vi.fn();
    const publicRoute = vi.fn();
    server.use(
      http.get(`${API}/memories/memory-1`, () => {
        privateRoute();
        return new HttpResponse(null, { status: 401 });
      }),
      http.get(`${API}/memories/public/memory-1`, () => {
        publicRoute();
        return HttpResponse.json({
          success: true,
          message: "Public memory retrieved",
          data: {
            _id: "memory-1",
            title: "A safe shared memory",
            body: "<p>Only public fields.</p>",
            tags: ["family"],
            created_at: "2026-08-29T10:00:00.000Z",
            attachments: [],
          },
        });
      }),
    );

    renderWithProviders(
      <Routes>
        <Route path="/post/:id" element={<PostPage />} />
      </Routes>,
      { route: "/post/memory-1" },
    );

    expect(
      await screen.findByRole("heading", { name: "A safe shared memory" }),
    ).toBeInTheDocument();
    await waitFor(() => expect(publicRoute).toHaveBeenCalledOnce());
    expect(privateRoute).not.toHaveBeenCalled();
    expect(screen.getByText("Only public fields.")).toBeInTheDocument();
  });
});

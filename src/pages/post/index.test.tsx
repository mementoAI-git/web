import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, server } from "@/test";
import { PostPage } from "./index";

vi.mock("focus-trap-react", () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("pdfjs-dist", () => ({ getDocument: vi.fn(), GlobalWorkerOptions: {}, version: "test" }));

const API = "http://localhost:3000/api";

describe("public post page", () => {
  it("retries a temporary failure and makes signup reachable", async () => {
    let failed = true;
    server.use(http.get(`${API}/memories/public/memory-1`, () => failed
      ? HttpResponse.json({}, { status: 503 })
      : HttpResponse.json({ data: { _id: "memory-1", title: "Recovered story", body: "Hello", attachments: [], tags: [] } })));
    renderWithProviders(<Routes><Route path="/post/:id" element={<PostPage />} /></Routes>, { route: "/post/memory-1" });
    const retry = await screen.findByRole("button", { name: "Retry loading story" });
    expect(screen.queryByText("This story isn’t available")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Join Memento" })).toHaveAttribute("href", "/register");
    expect(screen.queryByRole("link", { name: "Go to app" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", `/login?redirect=${encodeURIComponent("/post/memory-1")}`);
    failed = false;
    fireEvent.click(retry);
    expect(await screen.findByRole("heading", { name: "Recovered story" })).toBeVisible();
  });

  it("shows an unavailable state for a removed story", async () => {
    server.use(http.get(`${API}/memories/public/memory-1`, () => HttpResponse.json({}, { status: 404 })));
    renderWithProviders(<Routes><Route path="/post/:id" element={<PostPage />} /></Routes>, { route: "/post/memory-1" });
    expect(await screen.findByText("This story isn’t available")).toBeVisible();
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

  it("offers login with a way back when a signed-out reader hits a private story", async () => {
    const privateRoute = vi.fn();
    server.use(
      http.get(`${API}/memories/public/memory-1`, () => HttpResponse.json({}, { status: 404 })),
      http.get(`${API}/memories/memory-1`, () => {
        privateRoute();
        return new HttpResponse(null, { status: 401 });
      }),
    );
    renderWithProviders(<Routes><Route path="/post/:id" element={<PostPage />} /></Routes>, { route: "/post/memory-1" });
    await screen.findByText("This story isn’t available");
    for (const link of screen.getAllByRole("link", { name: "Log in" })) {
      expect(link).toHaveAttribute("href", `/login?redirect=${encodeURIComponent("/post/memory-1")}`);
    }
    expect(privateRoute).not.toHaveBeenCalled();
  });

  it("shows a private story to a signed-in reader who has access", async () => {
    server.use(
      http.get(`${API}/memories/public/memory-1`, () => HttpResponse.json({}, { status: 404 })),
      http.get(`${API}/memories/memory-1`, () => HttpResponse.json({
        success: true,
        data: { _id: "memory-1", title: "A private story", body: "<p>For family.</p>", attachments: [], tags: [], visibility: "private", created_at: "2026-08-29T10:00:00.000Z" },
      })),
    );
    renderWithProviders(<Routes><Route path="/post/:id" element={<PostPage />} /></Routes>, { route: "/post/memory-1", auth: true });
    expect(await screen.findByRole("heading", { name: "A private story" }, { timeout: 10000 })).toBeVisible();
    expect(screen.getByTestId("desktop-journal-shell")).toHaveAttribute("data-story-presentation", "page");
    expect(screen.queryByRole("button", { name: "Edit story" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to app" })).toHaveAttribute("href", "/overview");
  });

  it("opens attachment previews and hides the owner's visibility details", async () => {
    server.use(http.get(`${API}/memories/public/memory-1`, () => HttpResponse.json({
      success: true,
      data: {
        _id: "memory-1", title: "With a photo", body: "<p>Words.</p>", tags: ["family"], created_at: "2026-08-29T10:00:00.000Z",
        attachments: [{ _id: "file-1", name: "photo.jpg", type: "image/jpeg", url: "https://example.com/photo.jpg" }],
      },
    })));
    renderWithProviders(<Routes><Route path="/post/:id" element={<PostPage />} /></Routes>, { route: "/post/memory-1" });
    fireEvent.click(await screen.findByRole("button", { name: "Details" }));
    expect(await screen.findByText("#family")).toBeVisible();
    expect(screen.queryByText("Visibility")).not.toBeInTheDocument();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await waitFor(() => expect(screen.queryByText("Story Details")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /Open attachment 1/ }));
    expect(await screen.findByRole("dialog", { name: "Preview photo.jpg" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Download file" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Delete file" })).not.toBeInTheDocument();
  });
});

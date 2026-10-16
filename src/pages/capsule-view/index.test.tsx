import { StrictMode } from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Link, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, server } from "@/test";
import CapsuleViewPage from ".";

describe("external capsule view", () => {
  it("reuses the grant on retry and exchanges only once in Strict Mode", async () => {
    let failed = true;
    const exchange = vi.fn();
    server.use(
      http.post("*/capsule/view/exchange", () => { exchange(); return HttpResponse.json({ data: { grant: "private-grant" } }); }),
      http.get("*/capsule/view", ({ request }) => {
        expect(request.headers.get("x-capsule-view-grant")).toBe("private-grant");
        return failed ? HttpResponse.json({}, { status: 503 }) : HttpResponse.json({ data: { title: "Recovered capsule", body: "Hello" } });
      }),
    );
    renderWithProviders(<StrictMode><CapsuleViewPage /></StrictMode>, { route: "/capsule/view?token=private-token" });
    const retry = await screen.findByRole("button", { name: "Retry opening capsule" });
    expect(screen.queryByText(/may have expired/)).not.toBeInTheDocument();
    failed = false;
    fireEvent.click(retry);
    expect(await screen.findByRole("heading", { name: "Recovered capsule" })).toBeVisible();
    expect(exchange).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(localStorage)).not.toContain("private-grant");
    expect(JSON.stringify(sessionStorage)).not.toContain("private-grant");
  });

  it("retries an exchange failure before a grant is issued", async () => {
    let failed = true;
    server.use(
      http.post("*/capsule/view/exchange", () => failed ? HttpResponse.json({}, { status: 503 }) : HttpResponse.json({ data: { grant: "retry-grant" } })),
      http.get("*/capsule/view", () => HttpResponse.json({ data: { title: "Opened after retry", body: "Hello" } })),
    );
    renderWithProviders(<CapsuleViewPage />, { route: "/capsule/view?token=retry-token" });
    const retry = await screen.findByRole("button", { name: "Retry opening capsule" });
    failed = false;
    fireEvent.click(retry);
    expect(await screen.findByRole("heading", { name: "Opened after retry" })).toBeVisible();
  });

  it("explains how to reopen a page without its token", () => {
    renderWithProviders(<CapsuleViewPage />, { route: "/capsule/view" });
    expect(screen.getByText(/Open the original link from your invitation/)).toBeVisible();
  });

  it("clears the previous capsule and grant when opening a different link", async () => {
    server.use(
      http.post("*/capsule/view/exchange", async ({ request }) => {
        const { token } = await request.json() as { token: string };
        return HttpResponse.json({ data: { grant: `grant-${token}` } });
      }),
      http.get("*/capsule/view", ({ request }) => HttpResponse.json({ data: { title: request.headers.get("x-capsule-view-grant"), body: "Hello" } })),
    );
    renderWithProviders(<><Link to="/capsule/view?token=second">Open another capsule</Link><CapsuleViewPage /></>, { route: "/capsule/view?token=first" });
    expect(await screen.findByRole("heading", { name: "grant-first" })).toBeVisible();
    fireEvent.click(screen.getByRole("link", { name: "Open another capsule" }));
    expect(await screen.findByRole("heading", { name: "grant-second" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "grant-first" })).not.toBeInTheDocument();
  });

  it("offers sender guidance for an expired link", async () => {
    server.use(http.post("*/capsule/view/exchange", () => HttpResponse.json({}, { status: 401 })));
    renderWithProviders(<CapsuleViewPage />, { route: "/capsule/view?token=expired" });
    expect(await screen.findByRole("heading", { name: "This capsule can’t be opened" })).toBeVisible();
    expect(screen.queryByRole("button", { name: /Retry/ })).not.toBeInTheDocument();
  });

  it("removes the one-time token before exchanging it for an in-memory grant", async () => {
    const exchangeRequest = vi.fn();
    const viewRequest = vi.fn();
    const replaceState = vi.spyOn(window.history, "replaceState");
    server.use(
      http.post("*/capsule/view/exchange", async ({ request }) => {
        exchangeRequest();
        expect(await request.json()).toEqual({ token: "one-time-token-value" });
        return HttpResponse.json({
          success: true,
          data: { grant: "short-lived-grant", expires_at: new Date().toISOString() },
        });
      }),
      http.get("*/capsule/view", ({ request }) => {
        viewRequest();
        expect(request.headers.get("x-capsule-view-grant")).toBe("short-lived-grant");
        expect(request.headers.get("authorization")).toBeNull();
        return HttpResponse.json({
          success: true,
          data: {
            _id: "capsule-1",
            title: "For your next chapter",
            body: "Remember this day.",
            attachments: [],
          },
        });
      }),
    );

    renderWithProviders(
      <Routes>
        <Route path="/capsule/view" element={<CapsuleViewPage />} />
      </Routes>,
      { route: "/capsule/view?token=one-time-token-value" },
    );

    expect(replaceState).toHaveBeenCalledWith(null, "", "/capsule/view");
    await waitFor(() => expect(exchangeRequest).toHaveBeenCalledOnce());
    await waitFor(() => expect(viewRequest).toHaveBeenCalledOnce());
    expect(
      await screen.findByRole("heading", { name: "For your next chapter" }),
    ).toBeInTheDocument();
    await waitFor(() => expect(document.querySelector('meta[name="referrer"]')).toHaveAttribute("content", "no-referrer"));
  });
});

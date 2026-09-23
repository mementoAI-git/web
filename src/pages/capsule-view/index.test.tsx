import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, server } from "@/test";
import CapsuleViewPage from ".";

describe("external capsule view", () => {
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

import { fireEvent, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { renderWithProviders, server } from "@/test";
import AcceptInvitePage from ".";

function openInvite() {
  return renderWithProviders(<Routes><Route path="/accept-invite/:id" element={<AcceptInvitePage />} /></Routes>, { route: "/accept-invite/invite-1" });
}

describe("invitation loading", () => {
  it("recovers a temporary failure without displaying the server error", async () => {
    let failed = true;
    server.use(http.get("*/beneficiaries/invite/invite-1", () => failed
      ? HttpResponse.json({ message: "Database disconnected" }, { status: 503 })
      : HttpResponse.json({ data: { _id: "invite-1", email: "ada@example.com", benefactor: { first_name: "Wisdom" }, user: { email: "ada@example.com" }, access_scope: "shared_only" } })));
    openInvite();
    const retry = await screen.findByRole("button", { name: "Retry loading invitation" });
    expect(screen.queryByText("Database disconnected")).not.toBeInTheDocument();
    expect(screen.queryByText("This invitation isn’t available")).not.toBeInTheDocument();
    failed = false;
    fireEvent.click(retry);
    expect(await screen.findByRole("heading", { name: "Join Wisdom on Memento" })).toBeVisible();
  });

  it.each([400, 404, 410])("handles an unavailable invitation (%s)", async status => {
    server.use(http.get("*/beneficiaries/invite/invite-1", () => HttpResponse.json({}, { status })));
    openInvite();
    expect(await screen.findByRole("heading", { name: "This invitation isn’t available" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Sign in to Memento" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("button", { name: /Retry/ })).not.toBeInTheDocument();
  });
});

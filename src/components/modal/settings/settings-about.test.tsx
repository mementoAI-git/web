import { describe, it, expect, vi } from "vitest";
import { screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import { SettingsAbout } from "./settings-about";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const base = "http://localhost:3000/api";
function setup() {
  server.use(
    http.get(`${base}/users/persona`, () =>
      HttpResponse.json({
        success: true,
        data: { self_description: "My own introduction." },
      }),
    ),
  );
  renderWithProviders(<SettingsAbout />, {
    route: "/settings/general",
    auth: true,
  });
}

describe("SettingsAbout", () => {
  it("separates the original user bio from the short AI summary", async () => {
    server.use(
      http.get(`${base}/users/persona/memory-insights-summary`, () =>
        HttpResponse.json({
          success: true,
          data: {
            summary:
              "You value family. You enjoy travel. You love cooking.\n\nMore detail.",
          },
        }),
      ),
    );
    setup();
    const about = screen.getByRole("region", { name: "About me" });
    expect(
      await within(about).findByText("My own introduction."),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("You value family. You enjoy travel."),
    ).toBeInTheDocument();
    expect(
      within(about).queryByText(/You value family/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/You love cooking/)).not.toBeInTheDocument();
  });
  it("saves only self_description to the same persona endpoint used on mobile", async () => {
    let payload: unknown;
    server.use(
      http.put(`${base}/users/persona`, async ({ request }) => {
        payload = await request.json();
        return HttpResponse.json({ success: true });
      }),
    );
    setup();
    await screen.findByText("My own introduction.");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(
      screen.getByRole("dialog", { name: "Edit About me" }),
    ).toBeInTheDocument();
    expect(
      within(
        document.querySelector(
          'section[aria-labelledby="settings-about-heading"]',
        ) as HTMLElement,
      ).queryByRole("textbox"),
    ).not.toBeInTheDocument();
    const field = screen.getByRole("textbox", { name: "Your introduction" });
    expect(field).toHaveValue("My own introduction.");
    await user.clear(field);
    await user.type(field, "My new bio.");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("My new bio.")).toBeInTheDocument();
    expect(payload).toEqual({ self_description: "My new bio." });
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
  it("preserves the draft on failure and lets the user cancel without saving", async () => {
    server.use(
      http.put(`${base}/users/persona`, () =>
        HttpResponse.json({ success: false }, { status: 500 }),
      ),
    );
    setup();
    await screen.findByText("My own introduction.");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    const field = screen.getByRole("textbox", { name: "Your introduction" });
    await user.clear(field);
    await user.type(field, "Unsaved bio");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "We couldn’t save your introduction. Please try again.",
      ),
    );
    expect(field).toHaveValue("Unsaved bio");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("My own introduction.")).toBeInTheDocument();
  });
  it("shows an honest empty state when no AI summary exists", async () => {
    setup();
    expect(
      await screen.findByText(/Your AI summary will appear here/),
    ).toBeInTheDocument();
  });
  it("allows retrying a failed AI summary request", async () => {
    server.use(
      http.get(`${base}/users/persona/memory-insights-summary`, () =>
        HttpResponse.json({ success: false }, { status: 500 }),
      ),
    );
    setup();
    expect(
      await screen.findByText("We couldn’t load your AI summary."),
    ).toBeInTheDocument();
    server.use(
      http.get(`${base}/users/persona/memory-insights-summary`, () =>
        HttpResponse.json({
          success: true,
          data: { summary: "You cherish your friendships." },
        }),
      ),
    );
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByText("You cherish your friendships."),
    ).toBeInTheDocument();
  });
});

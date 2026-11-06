import { describe, it, expect, vi } from "vitest";
import { screen, within, waitFor } from "@testing-library/react";
import { useSWRConfig } from "swr";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import { SettingsAbout } from "./settings-about";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), dismiss: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const base = "http://localhost:3000/api";
function setup(customPersona = false) {
  if (!customPersona) server.use(
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

function RefreshableAbout() {
  const { mutate } = useSWRConfig();
  return <><button onClick={() => { void mutate("/users/persona").catch(() => undefined); }}>Refresh introduction</button><SettingsAbout /></>;
}

describe("SettingsAbout", () => {
  it("blocks editing until the saved introduction has loaded", async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => { release = resolve; });
    server.use(http.get(`${base}/users/persona`, async () => {
      await pending;
      return HttpResponse.json({ success: true, data: { self_description: "Arrived later." } });
    }));
    setup(true);
    expect(screen.getByText("Loading your introduction…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeDisabled();
    expect(screen.queryByText("Write a little about yourself, in your own words.")).not.toBeInTheDocument();
    release();
    await screen.findByText("Arrived later.");
    await userEvent.setup().click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("textbox", { name: "Your introduction" })).toHaveValue("Arrived later.");
  });

  it("offers retry rather than an empty editable bio after a load failure", async () => {
    server.use(http.get(`${base}/users/persona`, () => HttpResponse.json({}, { status: 500 })));
    setup(true);
    const retry = await screen.findByRole("button", { name: "Retry loading introduction" });
    expect(screen.getByRole("button", { name: "Edit" })).toBeDisabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith(
      "We couldn’t load your introduction. Please try again.", expect.objectContaining({ action: expect.objectContaining({ label: "Retry" }) }),
    );
    server.use(http.get(`${base}/users/persona`, () => HttpResponse.json({ success: true, data: { self_description: "Recovered." } })));
    await userEvent.setup().click(retry);
    expect(await screen.findByText("Recovered.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeEnabled();
  });

  it("retains cached text during a failed background refresh", async () => {
    server.use(http.get(`${base}/users/persona`, () => HttpResponse.json({ success: true, data: { self_description: "Keep this bio." } })));
    renderWithProviders(<RefreshableAbout />, { auth: true, route: "/settings/general" });
    await screen.findByText("Keep this bio.");
    server.use(http.get(`${base}/users/persona`, () => HttpResponse.json({}, { status: 500 })));
    await userEvent.setup().click(screen.getByRole("button", { name: "Refresh introduction" }));
    await screen.findByRole("button", { name: "Retry loading introduction" });
    expect(screen.getByText("Keep this bio.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeEnabled();
  });

  it("allows a genuinely empty introduction only after a successful load", async () => {
    server.use(http.get(`${base}/users/persona`, () => HttpResponse.json({ success: true, data: null })));
    setup(true);
    await screen.findByText("Write a little about yourself, in your own words.");
    expect(screen.getByRole("button", { name: "Edit" })).toBeEnabled();
  });

  it("keeps the dialog and draft during saving, and prevents duplicate submissions", async () => {
    let release!: () => void;
    let requests = 0;
    const pending = new Promise<void>((resolve) => { release = resolve; });
    server.use(http.put(`${base}/users/persona`, async () => {
      requests += 1;
      await pending;
      return HttpResponse.json({ success: true });
    }));
    setup();
    await screen.findByText("My own introduction.");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    const field = screen.getByRole("textbox", { name: "Your introduction" });
    await user.clear(field);
    await user.type(field, "New introduction.");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(requests).toBe(1));
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(field).toBeDisabled();
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /Saving/ }));
    expect(requests).toBe(1);
    release();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("New introduction.")).toBeInTheDocument();
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
      within(screen.getByRole("region", { name: "About me", hidden: true })).queryByRole("textbox"),
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
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.getByText("My own introduction.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("textbox", { name: "Your introduction" })).toHaveValue("My own introduction.");
  });
});

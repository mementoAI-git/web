import { describe, it, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import { SettingsSocialProfiles } from "./settings-social-profiles";

const base = "http://localhost:3000/api";
function setup() {
  server.use(
    http.get(`${base}/users/persona`, () =>
      HttpResponse.json({
        data: {
          user: "me",
          social_accounts: {
            x: { url: "https://x.com/memento", source: "ai" },
          },
        },
      }),
    ),
  );
  renderWithProviders(<SettingsSocialProfiles />, {
    route: "/settings/general?view=profile",
    auth: true,
  });
}
describe("SettingsSocialProfiles", () => {
  it("shows common fields inline and adds remaining platforms once", async () => {
    setup();
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "X / Twitter" })).toHaveValue(
        "@memento",
      ),
    );
    expect(screen.getAllByRole("textbox")).toHaveLength(3);
    for (const name of ["LinkedIn", "Instagram"])
      expect(screen.getByRole("textbox", { name })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: "Add new" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Bluesky" }));
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "Bluesky" })).toHaveFocus(),
    );
    await user.click(
      screen.getByRole("button", { name: "Add new" }),
    );
    expect(
      screen.queryByRole("menuitem", { name: "Bluesky" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: "YouTube" }));
    await user.click(screen.getByRole("button", { name: "Add new" }));
    await user.click(screen.getByRole("menuitem", { name: "Facebook" }));
    expect(
      screen.queryByRole("button", { name: "Add new" }),
    ).not.toBeInTheDocument();
  });
  it("saves manual links and removal markers without clearing untouched platforms", async () => {
    let payload: unknown;
    server.use(
      http.put(`${base}/users/persona`, async ({ request }) => {
        payload = await request.json();
        return HttpResponse.json({ success: true });
      }),
    );
    setup();
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "X / Twitter" })).toHaveValue(
        "@memento",
      ),
    );
    const user = userEvent.setup();
    await user.clear(screen.getByRole("textbox", { name: "X / Twitter" }));
    await user.type(
      screen.getByRole("textbox", { name: "LinkedIn" }),
      "https://linkedin.com/in/my-profile",
    );
    server.use(
      http.get(`${base}/users/persona`, () =>
        HttpResponse.json({
          data: {
            user: "me",
            social_accounts: {
              x: null,
              linkedin: {
                url: "https://www.linkedin.com/in/my-profile",
                source: "user",
              },
            },
          },
        }),
      ),
    );
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Save changes" }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("textbox", { name: "LinkedIn" })).toHaveValue(
      "https://www.linkedin.com/in/my-profile",
    );
    expect(screen.getByRole("textbox", { name: "X / Twitter" })).toHaveValue(
      "",
    );
    expect(payload).toEqual({
      social_accounts: {
        x: null,
        linkedin: "https://www.linkedin.com/in/my-profile",
      },
    });
  });
  it("accepts a typed handle and offers Paste on empty fields", async () => {
    let payload: unknown;
    server.use(
      http.put(`${base}/users/persona`, async ({ request }) => {
        payload = await request.json();
        return HttpResponse.json({ success: true });
      }),
    );
    setup();
    const user = userEvent.setup();
    const instagram = await screen.findByRole("textbox", { name: "Instagram" });
    expect(screen.getByRole("button", { name: "Paste LinkedIn link" })).toBeInTheDocument();
    await user.type(instagram, "@memento_app");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(payload).toEqual({
        social_accounts: { instagram: "https://www.instagram.com/memento_app" },
      }),
    );
  });
  it("links a saved profile and swaps to the full URL while editing", async () => {
    setup();
    const link = await screen.findByRole("link", { name: "Open X profile @memento" });
    expect(link).toHaveTextContent("@memento");
    expect(link).toHaveAttribute("href", "https://x.com/memento");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    const user = userEvent.setup();
    await user.click(screen.getByRole("textbox", { name: "X / Twitter" }));
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "X / Twitter" })).toHaveValue(
      "https://x.com/memento",
    );
  });
  it("links a typed handle after the field loses focus", async () => {
    setup();
    const user = userEvent.setup();
    await user.type(
      await screen.findByRole("textbox", { name: "Instagram" }),
      "@memento_app",
    );
    await user.tab();
    expect(
      screen.getByRole("link", { name: "Open Instagram profile @memento_app" }),
    ).toHaveAttribute("href", "https://www.instagram.com/memento_app");
  });
  it.each([
    ["an invalid value", "not a profile"],
    ["a lookalike domain", "https://linkedin.com.evil.test/in/me"],
    ["an executable scheme", "javascript:alert(1)"],
  ])("does not link %s", async (_case, value) => {
    setup();
    const user = userEvent.setup();
    await user.type(await screen.findByRole("textbox", { name: "LinkedIn" }), value);
    await user.tab();
    expect(screen.queryByRole("link", { name: /LinkedIn/ })).not.toBeInTheDocument();
  });
  it("reaches the link and then the input with Tab", async () => {
    setup();
    const link = await screen.findByRole("link", { name: "Open X profile @memento" });
    const user = userEvent.setup();
    await user.tab();
    expect(link).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("textbox", { name: "X / Twitter" })).toHaveFocus();
  });
  it("rejects a video URL in the YouTube profile field", async () => {
    setup();
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "X / Twitter" })).toHaveValue(
        "@memento",
      ),
    );
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: "Add new" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "YouTube" }));
    await user.type(
      screen.getByRole("textbox", { name: "YouTube" }),
      "https://youtube.com/watch?v=123",
    );
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter a valid HTTPS YouTube profile URL.",
    );
  });
  it("keeps edits when saving fails", async () => {
    setup();
    server.use(
      http.put(`${base}/users/persona`, () =>
        HttpResponse.json({ success: false }, { status: 500 }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "X / Twitter" })).toHaveValue(
        "@memento",
      ),
    );
    const user = userEvent.setup();
    await user.clear(screen.getByRole("textbox", { name: "X / Twitter" }));
    await user.type(
      screen.getByRole("textbox", { name: "X / Twitter" }),
      "https://x.com/newhandle",
    );
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn’t save your social profiles.",
    );
    expect(screen.getByRole("textbox", { name: "X / Twitter" })).toHaveValue(
      "@newhandle",
    );
  });
});

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
      expect(screen.getByRole("textbox", { name: "Twitter / X" })).toHaveValue(
        "https://x.com/memento",
      ),
    );
    expect(screen.getAllByRole("textbox")).toHaveLength(4);
    for (const name of ["Facebook", "LinkedIn", "Instagram"])
      expect(screen.getByRole("textbox", { name })).toBeVisible();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: "Add social profile" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Bluesky" }));
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "Bluesky" })).toHaveFocus(),
    );
    await user.click(
      screen.getByRole("button", { name: "Add social profile" }),
    );
    expect(
      screen.queryByRole("menuitem", { name: "Bluesky" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: "YouTube" }));
    expect(
      screen.queryByRole("button", { name: "Add social profile" }),
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
      expect(screen.getByRole("textbox", { name: "Twitter / X" })).toHaveValue(
        "https://x.com/memento",
      ),
    );
    const user = userEvent.setup();
    await user.clear(screen.getByRole("textbox", { name: "Twitter / X" }));
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
        screen.getByRole("button", { name: "Save changes" }),
      ).toBeDisabled(),
    );
    expect(screen.getByRole("textbox", { name: "LinkedIn" })).toHaveValue(
      "https://www.linkedin.com/in/my-profile",
    );
    expect(screen.getByRole("textbox", { name: "Twitter / X" })).toHaveValue(
      "",
    );
    expect(payload).toEqual({
      social_accounts: {
        x: null,
        linkedin: "https://www.linkedin.com/in/my-profile",
      },
    });
  });
  it("rejects a video URL in the YouTube profile field", async () => {
    setup();
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "Twitter / X" })).toHaveValue(
        "https://x.com/memento",
      ),
    );
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: "Add social profile" }),
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
      expect(screen.getByRole("textbox", { name: "Twitter / X" })).toHaveValue(
        "https://x.com/memento",
      ),
    );
    const user = userEvent.setup();
    await user.clear(screen.getByRole("textbox", { name: "Twitter / X" }));
    await user.type(
      screen.getByRole("textbox", { name: "Twitter / X" }),
      "https://x.com/newhandle",
    );
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn’t save your social profiles.",
    );
    expect(screen.getByRole("textbox", { name: "Twitter / X" })).toHaveValue(
      "https://x.com/newhandle",
    );
  });
});

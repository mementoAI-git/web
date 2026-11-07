import posthog from "@/lib/posthog";
vi.mock("@/lib/posthog", () => ({
  default: { __loaded: true, capture: vi.fn() },
}));
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import { AddBeneficiary } from "./index";

const trigger = vi.fn().mockResolvedValue({ success: true });
vi.mock("@/hooks/use-fetcher", () => ({
  default: () => ({ trigger, isMutating: false }),
}));
vi.mock("./select-group", () => ({ SelectGroup: () => null }));

describe("existing invitation flow", () => {
  it.each(["connection", "beneficiary", undefined] as const)(
    "sends %s invites with the correct scope",
    async (mode) => {
      renderWithProviders(<AddBeneficiary data={{ mode }} />, { auth: true });
      expect(
        screen.getByRole("heading", {
          name: mode !== "beneficiary" ? "Invite person" : "Invite beneficiary",
        }),
      ).toBeInTheDocument();
      await userEvent.type(screen.getByLabelText(mode !== "beneficiary" ? "Email address" : "Email"), "ada@example.com");
      await userEvent.type(screen.getByPlaceholderText("John Doe"), "Ada");
      await userEvent.type(
        screen.getByPlaceholderText("Brother, Friend, Spouse…"),
        "Friend",
      );
      await userEvent.click(
        screen.getByRole("button", { name: "Send invite" }),
      );
      expect(posthog.capture).toHaveBeenCalledWith("beneficiary_invited", {
        invitation_mode: mode ?? "connection",
        group_count: 0,
      });
      const payload = trigger.mock.calls.at(-1)?.[0];
      expect(payload).toMatchObject({
        email: "ada@example.com",
        name: "Ada",
        relationship: "Friend",
        groups: [],
      });
      if (mode !== "beneficiary")
        expect(payload.access_scope).toBe("shared_only");
      else expect(payload).not.toHaveProperty("access_scope");
    },
  );

  it("adds a connection invite to the marked groups", async () => {
    server.use(
      http.get("http://localhost:3000/api/groups", () =>
        HttpResponse.json({
          success: true,
          data: {
            docs: [
              { _id: "family", name: "Family", color: 0, members: [] },
              { _id: "friends", name: "Friends", color: 3, members: [] },
            ],
            totalPages: 1,
          },
        }),
      ),
    );
    renderWithProviders(<AddBeneficiary data={{ mode: "connection" }} />, { auth: true });
    const family = await screen.findByRole("button", { name: "Family" });
    expect(family).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(family);
    expect(family).toHaveAttribute("aria-pressed", "true");
    await userEvent.type(screen.getByLabelText("Email address"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Name"), "Ada");
    await userEvent.type(screen.getByLabelText("Relationship"), "Friend");
    await userEvent.click(screen.getByRole("button", { name: "Send invite" }));
    expect(trigger.mock.calls.at(-1)?.[0]).toMatchObject({ groups: ["family"] });
  });
});

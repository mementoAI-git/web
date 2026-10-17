import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import { AddBeneficiary } from "./index";

const trigger = vi.fn().mockResolvedValue({ success: true });
vi.mock("@/hooks/use-fetcher", () => ({
  default: () => ({ trigger, isMutating: false }),
}));
vi.mock("./select-group", () => ({ SelectGroup: () => null }));

describe("existing invitation flow", () => {
  it.each(["connection", "beneficiary"] as const)(
    "sends %s invites with the correct scope",
    async (mode) => {
      renderWithProviders(<AddBeneficiary data={{ mode }} />, { auth: true });
      expect(
        screen.getByRole("heading", {
          name: mode === "connection" ? "Invite someone" : "Invite beneficiary",
        }),
      ).toBeInTheDocument();
      await userEvent.type(
        screen.getByLabelText("Email"),
        "ada@example.com",
      );
      await userEvent.type(screen.getByPlaceholderText("John Doe"), "Ada");
      await userEvent.type(
        screen.getByPlaceholderText("Brother, Friend, Spouse…"),
        "Friend",
      );
      await userEvent.click(
        screen.getByRole("button", { name: "Send invite" }),
      );
      const payload = trigger.mock.calls.at(-1)?.[0];
      expect(payload).toMatchObject({
        email: "ada@example.com",
        name: "Ada",
        relationship: "Friend",
        groups: [],
      });
      if (mode === "connection")
        expect(payload.access_scope).toBe("shared_only");
      else expect(payload).not.toHaveProperty("access_scope");
    },
  );
});

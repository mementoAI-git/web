import { describe, it, expect, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import { mockUser } from "@/test/fixtures";
import General from "./general";

vi.mock("@/hooks/use-store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-store")>();
  return {
    ...actual,
    useStore: () => {
      const base = actual.useStore();
      return { ...base, user: mockUser, hydrated: true };
    },
  };
});

function renderGeneral() {
  renderWithProviders(<General />, { route: "/settings/general", auth: true });
}

describe("General", () => {
  it("links back to the settings overview", () => {
    renderGeneral();
    expect(screen.getByRole("heading", { name: "Personal info" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to settings" })).toHaveAttribute("href", "/settings");
  });

  it("shows About me above the editable profile fields", () => {
    renderGeneral();
    expect(screen.getByRole("heading", { name: "About me" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Test User");
    expect(screen.getByLabelText(/Display name/)).toHaveValue("Tester");
    expect(screen.getByLabelText("Birthday")).toHaveValue("1990-01-01");
    expect(screen.getByLabelText("Email address")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Phone number")).toHaveValue("+1234567890");
    expect(screen.getByLabelText("Location")).toHaveValue("");
  });

  it("saves each profile card on its own", async () => {
    renderGeneral();
    const identity = within(screen.getByRole("form", { name: "Your name and birthday" }));
    const contact = within(screen.getByRole("form", { name: "Your contact details" }));
    expect(identity.getByRole("button", { name: "Save changes" })).toBeDisabled();
    await userEvent.type(identity.getByLabelText("Name"), " Jr");
    expect(identity.getByRole("button", { name: "Save changes" })).toBeEnabled();
    expect(contact.getByRole("button", { name: "Save changes" })).toBeDisabled();
  });

  it("offers Add on empty fields and moves focus to the field", async () => {
    renderGeneral();
    await userEvent.click(screen.getByRole("button", { name: "Add location" }));
    expect(screen.getByLabelText("Location")).toHaveFocus();
  });
});

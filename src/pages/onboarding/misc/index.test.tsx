import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import MiscPage from "./index";

const navigate = vi.fn();
vi.mock("@/api/onboarding", () => ({
  fetchOnboardingDetails: async () => ({
    user: {},
    persona: {
      join_reasons: ["self_understanding"],
      current_priority: ["identity_self", "passions_interests"],
    },
  }),
}));
vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useNavigate: () => navigate,
}));
vi.mock("@/hooks/use-store", () => ({
  useStore: () => ({
    user: {
      _id: "user-123",
      nickname: "Jane",
      context: { self_description: "My saved introduction." },
    },
  }),
  StoreProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("onboarding questions", () => {
  beforeEach(() => {
    sessionStorage.clear();
    navigate.mockClear();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("collects reasons, about text and 2–3 life areas before showing the summary", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MiscPage />, {
      route: "/onboarding/misc",
      auth: true,
    });
    expect(
      screen.getByRole("heading", { name: /Okay Jane, let’s get started/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: /Preserve memories/i }),
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));
    const about = screen.getByRole("textbox", { name: "Enter About info" });
    await user.type(about, "I care about family.");
    expect(document.querySelector("#about-counter")).toHaveTextContent("20/2000");
    fireEvent.change(about, { target: { value: "a".repeat(2001) } });
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    fireEvent.change(about, { target: { value: "I care about family." } });
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Identity and self" }));
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: "Passions & Interests" }),
    );
    await user.click(screen.getByRole("button", { name: "Lessons & Wisdoms" }));
    expect(
      screen.getByRole("button", { name: "Everyday life" }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Identity and self" }));
    expect(screen.getByRole("button", { name: "Everyday life" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(
      screen.getByRole("textbox", { name: "Enter About info" }),
    ).toHaveValue("I care about family.");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(navigate).toHaveBeenCalledWith("/onboarding/summary");
  });

  it("prefills saved answers when revisiting onboarding from settings", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MiscPage />, {
      route: "/onboarding/misc?mode=revisit",
      auth: true,
    });
    const reason = await screen.findByRole("button", {
      name: "Reflect and understand myself better",
      pressed: true,
    });
    expect(reason).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      screen.getByRole("textbox", { name: "Enter About info" }),
    ).toHaveValue("My saved introduction.");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      screen.getByRole("button", { name: "Identity and self", pressed: true }),
    ).toBeInTheDocument();
  });

  it("shows inspiration as static text without changing the introduction", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MiscPage />, {
      route: "/onboarding/misc",
      auth: true,
    });
    await user.click(screen.getByRole("button", { name: /Just exploring/i }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(
      screen.getByRole("textbox", { name: "Enter About info" }),
      "Hello.",
    );
    expect(screen.queryByRole("button", { name: "What you do" })).not.toBeInTheDocument();
    await user.click(screen.getByText("What you do"));
    expect(
      screen.getByRole("textbox", { name: "Enter About info" }),
    ).toHaveValue("Hello.");
  });
});

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import SignupChoicePage from "./index";

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams("")],
  };
});

describe("SignupChoicePage", () => {
  it("renders two-panel signup shell with image and form choices", () => {
    const { container } = renderWithProviders(<SignupChoicePage />, { route: "/signup" });

    expect(screen.getByRole("heading", { name: /welcome/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /person standing near a scenic coastline/i })).toBeInTheDocument();
    const signupWithGoogle = screen.getByRole("button", { name: /sign up with google/i });
    expect(signupWithGoogle).toBeInTheDocument();
    expect(signupWithGoogle).toHaveClass("bg-fill-brand-strong", "text-text-inverse-strong");
    expect(screen.getByRole("link", { name: /use email and password/i })).toHaveAttribute("href", "/register");
    expect(screen.getByRole("link", { name: /i have an account/i })).toHaveAttribute("href", "/login");
    const shell = container.querySelector("section.rounded-3xl");
    expect(shell).toBeTruthy();
    expect(shell).toHaveClass("gap-6");
  });
});

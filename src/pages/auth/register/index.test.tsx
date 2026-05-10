import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";

import RegisterPage from "./index";

const API = "http://localhost:3000/api";
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("RegisterPage", () => {
  it("renders shadcn auth card fields", () => {
    renderWithProviders(<RegisterPage />, { route: "/register" });

    expect(
      screen.queryByText(/Create a new account on Memento to start crafting your stories/i),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i, { selector: "input" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("renders terms disclaimer at 12px with medium-weight links", () => {
    renderWithProviders(<RegisterPage />, { route: "/register" });

    const disclaimer = screen.getByText(/By clicking "Create account" you agree to the/i);
    expect(disclaimer.tagName).toBe("P");
    expect(disclaimer).toHaveClass("text-xs");

    const terms = screen.getByText("Terms of Use");
    const privacy = screen.getByText("Privacy Policy");
    expect(terms).toHaveClass("text-xs", "font-medium", "text-primary", "underline");
    expect(privacy).toHaveClass("text-xs", "font-medium", "text-primary", "underline");
  });

  it("places the terms disclaimer above the create account submit button", () => {
    renderWithProviders(<RegisterPage />, { route: "/register" });

    const form = screen.getByRole("button", { name: /create account/i }).closest("form");
    expect(form).toBeTruthy();
    const children = Array.from(form!.children);
    const disclaimer = screen.getByText(/By clicking "Create account" you agree to the/i);
    expect(disclaimer.tagName).toBe("P");
    const disclaimerIdx = children.indexOf(disclaimer);
    const buttonIdx = children.indexOf(screen.getByRole("button", { name: /create account/i }));
    expect(disclaimerIdx).toBeGreaterThanOrEqual(0);
    expect(buttonIdx).toBeGreaterThanOrEqual(0);
    expect(disclaimerIdx).toBeLessThan(buttonIdx);
  });

  it("uses 8px input radius, 44px submit height, and flat card chrome", () => {
    const { container } = renderWithProviders(<RegisterPage />, { route: "/register" });

    const form = container.querySelector("form");
    expect(form).toHaveClass("box-content");

    const emailField = screen.getByLabelText(/^email$/i);
    expect(emailField.parentElement).toHaveClass("grid", "gap-2", "box-content");

    expect(screen.getByLabelText(/first name/i)).toHaveClass("rounded-[8px]");
    expect(screen.getByLabelText(/last name/i)).toHaveClass("rounded-[8px]");
    expect(screen.getByLabelText(/^email$/i)).toHaveClass("rounded-[8px]");
    expect(screen.getByLabelText(/^password$/i, { selector: "input" })).toHaveClass("rounded-[8px]");

    const submit = screen.getByRole("button", { name: /create account/i });
    expect(submit).toHaveClass("h-11", "rounded-[8px]", "bg-v3-brand-strong", "text-white");

    const card = container.querySelector("[data-slot='card']");
    expect(card?.className).toMatch(/\bborder-0\b/);
    expect(card?.className).not.toMatch(/\bborder-v3-stroke-weak\b/);
  });

  it("submits registration and navigates to verify email", async () => {
    server.use(
      http.post(`${API}/auth/register`, async () =>
        HttpResponse.json({
          success: true,
          message: "Registered",
          data: {},
        }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { route: "/register" });

    await user.type(screen.getByLabelText(/first name/i), "Test");
    await user.type(screen.getByLabelText(/last name/i), "User");
    await user.type(screen.getByLabelText(/^email$/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i, { selector: "input" }), "Password1!");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/verify-email?email=test@example.com");
    });
  });
});

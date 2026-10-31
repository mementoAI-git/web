import posthog from "@/lib/posthog";
vi.mock("@/lib/posthog", () => ({ default: { __loaded: true, capture: vi.fn() } }));
import { captureReferral, getReferralCode } from "@/features/referrals/attribution";
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
      screen.queryByText(
        /Create a new account on Memento to start crafting your stories/i,
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/^password$/i, { selector: "input" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it("places the legal notice after the account actions", () => {
    renderWithProviders(<RegisterPage />, { route: "/register" });
    const disclaimer = screen.getByText(
      /By creating an account, you agree to our/i,
    );
    const submit = screen.getByRole("button", { name: /create account/i });
    const login = screen.getByRole("link", {
      name: /I already have an account/i,
    });
    expect(
      disclaimer.compareDocumentPosition(submit) &
        Node.DOCUMENT_POSITION_PRECEDING,
    ).toBeTruthy();
    expect(
      disclaimer.compareDocumentPosition(login) &
        Node.DOCUMENT_POSITION_PRECEDING,
    ).toBeTruthy();
    expect(login).toHaveAttribute("href", "/login");
  });

  it("uses 8px input radius, 48px submit height, and flat card chrome", () => {
    const { container } = renderWithProviders(<RegisterPage />, {
      route: "/register",
    });

    const form = container.querySelector("form");
    expect(form).toHaveClass("box-content");

    const emailField = screen.getByLabelText(/^email$/i);
    expect(emailField.parentElement).toHaveClass(
      "grid",
      "gap-1.5",
      "box-content",
    );

    expect(screen.getByLabelText(/first name/i)).toHaveClass("rounded-[8px]");
    expect(screen.getByLabelText(/last name/i)).toHaveClass("rounded-[8px]");
    expect(screen.getByLabelText(/^email$/i)).toHaveClass("rounded-[8px]");
    expect(
      screen.getByLabelText(/^password$/i, { selector: "input" }),
    ).toHaveClass("rounded-[8px]");

    const submit = screen.getByRole("button", { name: /create account/i });
    expect(submit).toHaveClass(
      "h-12",
      "rounded-[8px]",
      "bg-fill-brand-strong",
      "text-text-inverse-strong",
    );

    const card = container.querySelector("[data-slot='card']");
    expect(card?.className).toMatch(/\bborder-0\b/);
    expect(card?.className).not.toMatch(/\bborder-v3-stroke-weak\b/);
  });

  it("submits referral attribution and clears it after registration", async () => {
    captureReferral(`?ref=${"a".repeat(32)}`);
    server.use(
      http.post(`${API}/auth/register`, async ({ request }) => {
        expect(await request.json()).toMatchObject({ delivery: "code", referral_code: "a".repeat(32) });
        return HttpResponse.json({
          success: true,
          message: "Registered",
          data: {},
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { route: "/register" });

    await user.type(screen.getByLabelText(/first name/i), "Test");
    await user.type(screen.getByLabelText(/last name/i), "User");
    await user.type(screen.getByLabelText(/^email$/i), "test@example.com");
    await user.type(
      screen.getByLabelText(/^password$/i, { selector: "input" }),
      "Password1!",
    );
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(getReferralCode()).toBeUndefined();
      expect(posthog.capture).toHaveBeenCalledWith("account_registered");
      expect(mockNavigate).toHaveBeenCalledWith(
        "/verify-email?email=test%40example.com",
        { state: { verificationSentAt: expect.any(Number) } },
      );
    });
  });
});

it("toggles password visibility without submitting the form", async () => {
  const user = userEvent.setup();
  renderWithProviders(<RegisterPage />, { route: "/register" });
  const password = screen.getByLabelText(/^password$/i, { selector: "input" });
  expect(password).toHaveAttribute("type", "password");
  await user.click(screen.getByRole("button", { name: "Show password" }));
  expect(password).toHaveAttribute("type", "text");
  await user.click(screen.getByRole("button", { name: "Hide password" }));
  expect(password).toHaveAttribute("type", "password");
});

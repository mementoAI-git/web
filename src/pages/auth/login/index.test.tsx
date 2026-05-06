import { beforeAll, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";

import LoginPage from "./index";

const API = "http://localhost:3000/api";
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams("")],
  };
});

describe("LoginPage", () => {
  beforeAll(() => {
    if (!("ResizeObserver" in globalThis)) {
      class ResizeObserverMock {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
      // @ts-expect-error jsdom polyfill for Radix in test env
      globalThis.ResizeObserver = ResizeObserverMock;
    }
  });

  it("renders shadcn auth card fields", () => {
    renderWithProviders(<LoginPage />, { route: "/login" });

    expect(screen.getByRole("heading", { level: 1, name: /^welcome back$/i })).toBeInTheDocument();
    expect(screen.getByText(/^please login to continue$/i)).toBeInTheDocument();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i, { selector: "input" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^login$/i })).toBeInTheDocument();
  });

  it("applies auth control heights and forgot-password link styles", () => {
    renderWithProviders(<LoginPage />, { route: "/login" });

    expect(screen.getByRole("button", { name: /^login$/i })).toHaveClass("h-11", "bg-v3-brand-strong", "text-white");

    expect(screen.getByLabelText(/email/i)).toHaveClass("rounded-[8px]");
    expect(screen.getByLabelText(/^password$/i, { selector: "input" })).toHaveClass("rounded-[8px]");

    const passkey = screen.getByRole("button", { name: /sign in with a passkey/i });
    expect(passkey).toHaveClass("h-11");
    expect(passkey.querySelector("svg.lucide-fingerprint-pattern")).toBeInTheDocument();

    const forgot = screen.getByRole("link", { name: /forgot password/i });
    expect(forgot).toHaveClass("flex", "font-semibold");

    const signup = screen.getByRole("link", { name: /create an account/i });
    expect(signup).toHaveAttribute("href", "/signup");
    expect(signup).toHaveClass("text-xs", "font-semibold");
  });

  it("does not duplicate the OAuth divider after the passkey control", () => {
    renderWithProviders(<LoginPage />, { route: "/login" });
    expect(screen.queryByText("Or", { exact: true })).not.toBeInTheDocument();
  });

  it("shows passkey and Google before the email and password fields in document order", () => {
    renderWithProviders(<LoginPage />, { route: "/login" });

    const email = screen.getByLabelText(/email/i);
    const passkey = screen.getByRole("button", { name: /sign in with a passkey/i });
    const google = screen.getByRole("button", { name: /continue with google/i });

    expect(email.compareDocumentPosition(passkey) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    expect(email.compareDocumentPosition(google) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  it("submits valid credentials and navigates to overview when onboarded", async () => {
    server.use(
      http.post(`${API}/auth/login`, async () =>
        HttpResponse.json({
          success: true,
          message: "Logged in",
          data: {
            access_token: "mock-access-token",
            refresh_token: "mock-refresh-token",
            expires_at: new Date(Date.now() + 3600000).toISOString(),
            refresh_expires_at: new Date(Date.now() + 86400000).toISOString(),
            onboarded: true,
          },
        }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: "/login" });

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i, { selector: "input" }), "password123");
    await user.click(screen.getByRole("button", { name: /^login$/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/overview");
    });
  });
});

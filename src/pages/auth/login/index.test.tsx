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

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^login$/i })).toBeInTheDocument();
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
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^login$/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/overview");
    });
  });
});

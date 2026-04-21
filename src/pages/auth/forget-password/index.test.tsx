import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";

import ForgetPasswordPage from "./index";

const API = "http://localhost:3000/api";
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("ForgetPasswordPage", () => {
  it("renders shadcn auth card with email field", () => {
    renderWithProviders(<ForgetPasswordPage />, { route: "/forget-password" });

    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^submit$/i })).toBeInTheDocument();
  });

  it("submits send-link request and navigates to check mail", async () => {
    server.use(
      http.post(`${API}/auth/send-link`, async () =>
        HttpResponse.json({
          success: true,
          message: "Check your email",
          data: {},
        }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<ForgetPasswordPage />, { route: "/forget-password" });

    await user.type(screen.getByLabelText(/^email$/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /^submit$/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/check-mail?email=test@example.com");
    });
  });
});

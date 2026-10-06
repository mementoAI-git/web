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
  it("renders email field with register-aligned card, input, and submit control", () => {
    const { container } = renderWithProviders(<ForgetPasswordPage />, {
      route: "/forget-password",
    });

    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    const submit = screen.getByRole("button", { name: /^send code$/i });
    expect(submit).toBeInTheDocument();
    expect(submit).toHaveClass(
      "h-11",
      "rounded-[8px]",
      "bg-fill-brand-strong",
      "text-text-inverse-strong",
    );

    expect(screen.getByLabelText(/^email$/i)).toHaveClass("rounded-[8px]");

    const card = container.querySelector(".group\\/card");
    expect(card).toHaveClass(
      "rounded-none",
      "border-0",
      "bg-transparent",
      "ring-0",
    );
  });

  it("submits recovery/send-code request and navigates to check mail", async () => {
    server.use(
      http.post(`${API}/auth/recovery/send-code`, async () =>
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
    await user.click(screen.getByRole("button", { name: /^send code$/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "/check-mail?email=test%40example.com",
        { state: { recoverySentAt: expect.any(Number) } },
      );
    });
  });
});

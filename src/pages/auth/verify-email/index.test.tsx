import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "@/test";

import VerifyEmailPage from "./index";

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams("email=test@example.com")],
  };
});

describe("VerifyEmailPage", () => {
  it("renders mailbox action in auth split layout", () => {
    renderWithProviders(<VerifyEmailPage />, { route: "/verify-email?email=test@example.com" });

    expect(screen.getByRole("heading", { name: /verify your email/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open mailbox/i })).toBeInTheDocument();
  });
});

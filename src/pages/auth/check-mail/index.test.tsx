import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "@/test";

import CheckMailPage from "./index";

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams("email=test@example.com")],
  };
});

describe("CheckMailPage", () => {
  it("renders inbox messaging and mailbox action", () => {
    renderWithProviders(<CheckMailPage />, { route: "/check-mail?email=test@example.com" });

    expect(screen.getByRole("heading", { name: /check your inbox/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open mailbox/i })).toBeInTheDocument();
  });
});

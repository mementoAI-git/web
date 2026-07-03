import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import NicknamePage from "./index";

const mockNavigate = vi.fn();
const mockTrigger = vi.fn().mockResolvedValue({});

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/hooks/use-fetcher", () => ({
  __esModule: true,
  default: () => ({ isMutating: false, trigger: mockTrigger }),
}));

describe("NicknamePage", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockTrigger.mockClear();
  });

  it("saves nickname and navigates to onboard misc step", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NicknamePage />, {
      route: "/onboarding/nickname",
      auth: true,
    });

    await user.type(
      screen.getByPlaceholderText(/preferred name or nickname/i),
      "River",
    );
    await user.click(screen.getByRole("button", { name: /Continue/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/onboarding/misc");
    });
    expect(mockTrigger).toHaveBeenCalledWith({ nickname: "River" });
  });
});

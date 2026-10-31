import { expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { renderWithProviders, mockUser } from "@/test";
import { server } from "@/test/mocks/server";
import { initialStates, StoreValueProvider } from "@/hooks/use-store";
import BeneficiaryPage from "./index";

it.each(["Continue", "Skip for now"])(
  "persists onboarding status before leaving with %s",
  async (name) => {
    const setUser = vi.fn();
    const skip = vi.fn();
    server.use(
      http.post("*/users/onboarding/skip", () => {
        skip();
        return HttpResponse.json({ success: true });
      }),
    );
    renderWithProviders(
      <StoreValueProvider
        value={{
          ...initialStates,
          user: { ...mockUser, onboarded: false, onboarding_status: "never" },
          setUser,
        }}
      >
        <Routes>
          <Route path="/onboarding/beneficiary" element={<BeneficiaryPage />} />
          <Route path="/overview" element={<p>Dashboard destination</p>} />
        </Routes>
      </StoreValueProvider>,
      { route: "/onboarding/beneficiary", auth: true },
    );
    await userEvent.click(screen.getByText(name, { exact: true }));
    await waitFor(() => expect(skip).toHaveBeenCalledOnce());
    expect(setUser).toHaveBeenCalledWith(
      expect.objectContaining({ onboarding_status: "skipped" }),
    );
    expect(
      await screen.findByText("Dashboard destination"),
    ).toBeInTheDocument();
  },
);

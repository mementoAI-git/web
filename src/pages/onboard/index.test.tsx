import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "@/test";
import { OnboardPage } from "./index";

describe("OnboardPage", () => {
  it("renders hero image and CTA, then navigates to welcome", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/onboard" element={<OnboardPage />} />
        <Route path="/onboard/welcome" element={<div>Welcome route</div>} />
      </Routes>,
      { route: "/onboard", auth: true },
    );

    expect(
      screen.getByRole("img", { name: /welcome - memories and moments to cherish/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/your quiet space to reflect, to preserve, to remember/i),
    ).toBeInTheDocument();

    const cta = screen.getByRole("button", { name: /let's go!/i });
    expect(cta).toHaveClass("!bg-orange");
    expect(cta).toHaveClass("rounded-[64px]");

    await user.click(cta);
    expect(await screen.findByText("Welcome route")).toBeInTheDocument();
  });
});

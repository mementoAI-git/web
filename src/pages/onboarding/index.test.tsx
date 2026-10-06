import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "@/test";
import { OnboardPage } from "./index";

describe("OnboardPage", () => {
  it("starts at the welcome card and continues to the nickname screen", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/onboarding" element={<OnboardPage />} />
        <Route
          path="/onboarding/nickname"
          element={<div>Nickname route</div>}
        />
      </Routes>,
      { route: "/onboarding", auth: true },
    );
    expect(
      screen.getByRole("heading", {
        name: /hey there, welcome to memento ai/i,
      }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Continue" }));
    expect(await screen.findByText("Nickname route")).toBeInTheDocument();
  });
});

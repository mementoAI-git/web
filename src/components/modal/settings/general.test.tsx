import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import General from "./general";

describe("General", () => {
  it("renders Revisit preferences link with correct href", () => {
    renderWithProviders(<General />, { route: "/overview", auth: true });
    const link = screen.getByRole("link", { name: /revisit preferences/i });
    expect(link).toHaveAttribute("href", "/onboard/misc");
  });
});

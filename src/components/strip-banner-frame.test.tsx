import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import { StripBanner } from "./strip-banner-frame";

describe("StripBanner", () => {
  it("renders a theme-adaptive neutral surface as a status region by default", () => {
    renderWithProviders(<StripBanner>Reminder</StripBanner>);

    const banner = screen.getByRole("status");
    expect(banner).toHaveTextContent("Reminder");
    expect(banner.className).toMatch(/\bbg-fill-neutral-weak\b/);
    expect(banner.className).toMatch(/\bborder-stroke-neutral-weak\b/);
    expect(banner.className).toMatch(/\btext-text-neutral-strong\b/);
  });

  it("stacks at the header's level so it paints above the nav blur", () => {
    renderWithProviders(<StripBanner>Reminder</StripBanner>);

    const frame = screen.getByRole("status").parentElement;
    expect(frame?.className).toMatch(/\brelative\b/);
    expect(frame?.className).toContain("z-[45]");
  });

  it("applies a custom role and layout classes to the surface", () => {
    renderWithProviders(
      <StripBanner role="banner" className="px-4">
        Reminder
      </StripBanner>,
    );

    const banner = screen.getByRole("banner");
    expect(banner.className).toMatch(/\bpx-4\b/);
    expect(banner.className).toMatch(/\bbg-fill-neutral-weak\b/);
  });
});

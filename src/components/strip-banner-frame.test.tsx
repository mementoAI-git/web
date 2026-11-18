import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import { StripBanner, StripBannerAction } from "./strip-banner-frame";

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

  it("runs its main action when the surface is clicked", async () => {
    const onActivate = vi.fn();
    renderWithProviders(
      <StripBanner onActivate={onActivate}>
        <p>Reminder</p>
      </StripBanner>,
    );

    await userEvent.click(screen.getByText("Reminder"));
    expect(onActivate).toHaveBeenCalledOnce();
    expect(screen.getByRole("status").className).toMatch(/\bcursor-pointer\b/);
  });

  it("leaves clicks on its own buttons to those buttons", async () => {
    const onActivate = vi.fn();
    const onDismiss = vi.fn();
    renderWithProviders(
      <StripBanner onActivate={onActivate}>
        Reminder
        <button type="button" onClick={onDismiss}>
          Dismiss
        </button>
      </StripBanner>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(onActivate).not.toHaveBeenCalled();
  });

  it("is not clickable without a main action", () => {
    renderWithProviders(<StripBanner>Reminder</StripBanner>);
    expect(screen.getByRole("status").className).not.toMatch(/\bcursor-pointer\b/);
  });

  it("shows its action button from the desktop breakpoint up", () => {
    renderWithProviders(
      <StripBannerAction onClick={() => {}}>Set up</StripBannerAction>,
    );
    const button = screen.getByRole("button", { name: "Set up" });
    expect(button.className).toMatch(/\bhidden\b/);
    expect(button.className).toMatch(/\bmd:inline-flex\b/);
  });
});

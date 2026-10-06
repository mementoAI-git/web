import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders as render } from "@/test";

import { AuthCenteredSplitShell, AuthSplitShell } from "./auth-split-layout";

describe("AuthCenteredSplitShell", () => {
  it("hides the hero aside until the md breakpoint", () => {
    const { container } = render(
      <AuthCenteredSplitShell>
        <p>Form content</p>
      </AuthCenteredSplitShell>,
    );

    const aside = container.querySelector("aside");
    expect(aside?.className).toMatch(/\bhidden\b/);
    expect(aside?.className).toMatch(/md:block/);
  });

  it("renders the coastal hero image with expected alt text", () => {
    render(
      <AuthCenteredSplitShell>
        <p>Form</p>
      </AuthCenteredSplitShell>,
    );

    const heroImage = screen.getByRole("img", { name: /person standing near a scenic coastline/i });
    expect(heroImage).toBeInTheDocument();
    expect(heroImage).toHaveClass("size-full");
  });

  it("keeps the hero column fixed width and vertically centers the form column", () => {
    const { container } = render(
      <AuthCenteredSplitShell>
        <p>Form</p>
      </AuthCenteredSplitShell>,
    );

    const section = container.querySelector("section.rounded-3xl");
    expect(section?.className).toMatch(/max-h-\[560px\]/);

    const heroAside = container.querySelector("aside");
    expect(heroAside?.className).toMatch(/w-\[378px\]/);
    expect(heroAside?.className).toMatch(/\bshrink-0\b/);

    const formColumn = container.querySelector("section.rounded-3xl > div.flex.flex-col");
    expect(formColumn?.className).toMatch(/\bitems-start\b/);
    expect(formColumn?.className).toMatch(/\bjustify-center\b/);
  });
});

describe("AuthSplitShell", () => {
  it("hides the marketing image aside until the lg breakpoint", () => {
    const { container } = render(
      <AuthSplitShell>
        <p>Form content</p>
      </AuthSplitShell>,
    );

    const aside = container.querySelector("aside");
    expect(aside?.className).toMatch(/\bhidden\b/);
    expect(aside?.className).toMatch(/lg:flex/);
  });

  it("shows a compact logo above the form on small screens only", () => {
    const { container } = render(
      <AuthSplitShell>
        <p>Form content</p>
      </AuthSplitShell>,
    );

    const mobileLogoRow = container.querySelector(".shrink-0.px-4.pt-5.lg\\:hidden");
    expect(mobileLogoRow).toBeTruthy();
    expect(mobileLogoRow?.textContent).toContain("memento.");
  });
});

  it.each([AuthCenteredSplitShell, AuthSplitShell])("exposes theme options without signing in", (Shell) => {
    render(<Shell><p>Form</p></Shell>);
    expect(screen.getByRole("button", { name: /switch to (light|dark) mode/i })).toBeVisible();
  });

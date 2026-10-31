import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders as render } from "@/test";

import AuthLayout, { AuthFormPanel } from "./layout";

describe("AuthFormPanel", () => {
  it("uses display heading typography for the title", () => {
    const { container } = render(
      <AuthFormPanel title="Test title" subtitle="Subtitle copy">
        <p>Form</p>
      </AuthFormPanel>,
    );

    expect(container.querySelector(".auth-motion-panel")).toHaveClass("box-content", "group/auth-root", "w-full");

    const title = screen.getByRole("heading", { level: 1, name: "Test title" });
    expect(title).toHaveClass("font-garamond", "text-[1.625rem]", "font-normal");
    expect(screen.getByText("Subtitle copy")).toBeInTheDocument();
  });

  it("omits the subtitle paragraph when subtitle is not provided", () => {
    render(
      <AuthFormPanel title="Test title">
        <p>Form</p>
      </AuthFormPanel>,
    );

    const title = screen.getByRole("heading", { level: 1, name: "Test title" });
    expect(title).toBeInTheDocument();
    const header = title.closest("header");
    expect(header?.querySelector("p")).toBeNull();
  });
});

describe("AuthLayout", () => {
  it("wraps the form panel in the centered split shell with hero column", () => {
    const { container } = render(
      <AuthLayout title="Welcome" subtitle="Sign in">
        <p>Fields</p>
      </AuthLayout>,
    );

    expect(screen.getByRole("heading", { name: "Welcome" })).toBeInTheDocument();
    expect(container.querySelector(".h-dvh")).toBeTruthy();
    expect(container.querySelector("section.rounded-3xl")).toBeTruthy();
    const aside = container.querySelector("aside");
    expect(aside?.className).toMatch(/\bhidden\b/);
    expect(aside?.className).toMatch(/md:block/);
  });
});

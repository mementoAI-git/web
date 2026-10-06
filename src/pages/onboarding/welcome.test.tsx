import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import WelcomePage from "./welcome";

describe("WelcomePage", () => {
  it("renders heading and intro text", () => {
    renderWithProviders(<WelcomePage />, {
      route: "/onboarding/welcome",
      auth: true,
    });
    expect(
      screen.getByRole("heading", {
        name: /hey there, welcome to memento ai/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/what can you do on memento\?/i),
    ).toBeInTheDocument();
  });

  it("renders all three feature sections with illustrations", () => {
    renderWithProviders(<WelcomePage />, {
      route: "/onboarding/welcome",
      auth: true,
    });
    expect(
      screen.getByRole("heading", { name: /remember and reflect/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /converse with your digital twin/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /share your stories with loved ones/i,
      }),
    ).toBeInTheDocument();

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(3);
    expect(images[0]).toHaveAttribute("alt", "Remember and reflect");
    expect(images[1]).toHaveAttribute("alt", "Converse with your digital twin");
    expect(images[2]).toHaveAttribute(
      "alt",
      "Share your stories with loved ones",
    );
  });

  it("renders Continue link to nickname page", () => {
    renderWithProviders(<WelcomePage />, {
      route: "/onboarding/welcome",
      auth: true,
    });
    const link = screen.getByRole("link", { name: /continue/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/onboarding/nickname");
  });
});

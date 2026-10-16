import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProCardBackground } from "./pro-card-background";

vi.mock("shaders/react", () => {
  throw new TypeError("Failed to fetch dynamically imported module: shaders/react");
});

afterEach(() => {
  delete (navigator as Navigator & { gpu?: unknown }).gpu;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Pro card module failure", () => {
  it("keeps plan controls mounted when the decorative shader import fails", async () => {
    Object.defineProperty(navigator, "gpu", { value: {}, configurable: true });
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    vi.spyOn(window, "getComputedStyle").mockReturnValue({ backgroundColor: "rgb(233, 130, 70)", getPropertyValue: () => "" } as unknown as CSSStyleDeclaration);
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onCaughtError = vi.fn();
    const { container } = render(<><ProCardBackground /><button>Current plan</button></>, { onCaughtError });
    await waitFor(() => expect(onCaughtError).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Current plan" })).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).toHaveClass("bg-fill-brand-strong");
  });
});

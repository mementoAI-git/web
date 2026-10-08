import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { ProCardBackground } from "./pro-card-background";

vi.mock("shaders/react", () => ({
  Shader: ({
    children,
    disableTelemetry,
  }: {
    children: ReactNode;
    disableTelemetry: boolean;
  }) => (
    <div data-testid="shader" data-telemetry-disabled={disableTelemetry}>
      {children}
    </div>
  ),
  FlowingGradient: () => <canvas data-testid="flowing-gradient" />,
}));

function gpuEnvironment(reduced = false) {
  Object.defineProperty(navigator, "gpu", { value: {}, configurable: true });
  let change: (() => void) | undefined;
  const media = {
    matches: reduced,
    addEventListener: vi.fn((_event: string, handler: () => void) => {
      change = handler;
    }),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => media),
  );
  vi.spyOn(window, "getComputedStyle").mockReturnValue({
    backgroundColor: "rgb(233, 130, 70)",
  } as CSSStyleDeclaration);
  return {
    media,
    setReduced: () => {
      media.matches = true;
      change?.();
    },
  };
}

afterEach(() => {
  delete (navigator as Navigator & { gpu?: unknown }).gpu;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Pro card shader", () => {
  it("keeps the static orange surface on browsers without WebGPU", () => {
    const { container } = render(<ProCardBackground />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByTestId("shader")).not.toBeInTheDocument();
  });
  it("keeps the static surface when reduced motion is requested", () => {
    gpuEnvironment(true);
    render(<ProCardBackground />);
    expect(screen.queryByTestId("shader")).not.toBeInTheDocument();
  });
  it("loads FlowingGradient and removes it when reduced motion is enabled", async () => {
    const { media, setReduced } = gpuEnvironment();
    const { unmount } = render(<ProCardBackground />);
    expect(await screen.findByTestId("flowing-gradient")).toBeInTheDocument();
    expect(screen.getByTestId("shader")).toHaveAttribute(
      "data-telemetry-disabled",
      "true",
    );
    act(setReduced);
    await waitFor(() =>
      expect(screen.queryByTestId("shader")).not.toBeInTheDocument(),
    );
    unmount();
    expect(media.removeEventListener).toHaveBeenCalled();
  });
});

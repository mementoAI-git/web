import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router-dom";
import { renderWithProviders } from "@/test";
import { useModal } from "@/hooks/use-modal";
import { QuickTools } from "./quick-tools";

const music = vi.hoisted(() => ({ stopTrack: vi.fn(), pauseTrack: vi.fn(), resumeTrack: vi.fn(), setVolume: vi.fn(), isPlaying: true }));
vi.mock("@/hooks/use-background-music", () => ({
  useBackgroundMusic: () => ({
    ...music, currentTrack: "moonlight", volume: 50,
    playTrack: vi.fn(),
    audioFiles: [{ title: "Moonlight", key: "moonlight" }],
  }),
}));

function Destination() {
  const { state } = useModal();
  const location = useLocation();
  return <output data-testid="destination">{state[0]?.name ?? `${location.pathname}${location.search}`}</output>;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  music.isPlaying = true;
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 1440 });
});

afterEach(() => vi.unstubAllGlobals());

async function openTools() {
  const user = userEvent.setup();
  renderWithProviders(<><QuickTools /><Destination /></>, { auth: true, route: "/overview" });
  await user.click(screen.getByRole("button", { name: "Quick tools" }));
  return user;
}

describe("QuickTools", () => {
  it("opens a desktop popover and restores focus on Escape", async () => {
    const user = await openTools();
    expect(screen.getByRole("dialog", { name: "Quick tools" })).toHaveAttribute("data-slot", "popover-content");
    expect(screen.getByRole("region", { name: "Music player" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Off No tune" })).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Quick tools" })).toHaveFocus();
  });

  it("uses a bottom sheet on mobile", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    const user = await openTools();
    expect(screen.getByRole("dialog", { name: "Quick tools" })).toHaveAttribute("data-side", "bottom");
    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("hands off from the mobile sheet to Insights", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    const user = await openTools();
    await user.click(screen.getByRole("button", { name: "Insights" }));
    await waitFor(() => expect(screen.getByTestId("destination")).toHaveTextContent("memory-insights"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it.each([
    ["Quick capture", "quick-capture"],
    ["Add story/item", "create-memory"],
    ["Insights", "memory-insights"],
    ["People", "/settings/beneficiary"],
    ["Voice mode", "/chat?mode=voice"],
  ])("opens %s and closes the tools panel", async (label, destination) => {
    const user = await openTools();
    await user.click(screen.getByRole("button", { name: label }));
    await waitFor(() => expect(screen.getByTestId("destination")).toHaveTextContent(destination));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("controls the shared music player without dismissing the panel", async () => {
    const user = await openTools();
    await user.click(screen.getByRole("button", { name: "Stop music" }));
    expect(music.stopTrack).toHaveBeenCalledOnce();
    const slider = screen.getByRole("slider");
    slider.focus();
    await user.keyboard("{ArrowRight}");
    expect(music.setVolume).toHaveBeenCalledWith(51);
    expect(screen.getByRole("dialog")).toBeVisible();
  });

  it("resumes a paused track", async () => {
    music.isPlaying = false;
    const user = await openTools();
    await user.click(screen.getByRole("button", { name: "Play music" }));
    expect(music.resumeTrack).toHaveBeenCalledOnce();
  });
});

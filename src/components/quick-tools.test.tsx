import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
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
  it.each([
    ["/overview", true],
    ["/chat/new", true],
    ["/settings/beneficiary", false],
    ["/stories", false],
  ])("preserves the page's sky card scope in its portal on %s", async (route, scoped) => {
    const user = userEvent.setup();
    renderWithProviders(<QuickTools />, { auth: true, route });
    await user.click(screen.getByRole("button", { name: "Quick tools" }));
    expect(screen.getByRole("dialog", { name: "Quick tools" }).hasAttribute("data-sky-card-page")).toBe(scoped);
  });

  it("opens a desktop popover and restores focus on Escape", async () => {
    const user = await openTools();
    expect(screen.getByRole("dialog", { name: "Quick tools" })).toHaveAttribute("data-slot", "popover-content");
    expect(screen.getByRole("region", { name: "Music player" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Off No tune" })).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Quick tools" })).toHaveFocus();
  });

  it("lists quick actions as short rows on phones", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    await openTools();
    const button = within(screen.getByRole("region", { name: "Quick actions" })).getByRole("button", { name: "Quick note" });
    expect(button).toHaveClass("flex-row", "items-center", "p-3");
    expect(button).not.toHaveClass("h-[85px]");
    expect(screen.getByRole("button", { name: /^Theme: / })).toBeInTheDocument();
  });

  it("shows Quick note and Add people without story, voice mode or links", async () => {
    await openTools();
    expect(screen.queryByRole("button", { name: /^Theme: / })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Quick tools" })).toHaveClass("w-[315px]");
    const player = screen.getByRole("region", { name: "Music player" });
    expect(player).toHaveClass("bg-fill-neutral-weak");
    const actions = screen.getByRole("region", { name: "Quick actions" });
    for (const label of ["Quick note", "Add people"]) {
      const button = within(actions).getByRole("button", { name: label });
      expect(within(button).getByText(label)).toBeVisible();
      expect(button).toHaveAttribute("title", label);
    }
    expect(screen.queryByRole("region", { name: "Quick links" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Insights" })).not.toBeInTheDocument();
    expect(within(actions).queryByRole("button", { name: "Voice mode" })).not.toBeInTheDocument();
    expect(within(actions).queryByRole("button", { name: "Add story" })).not.toBeInTheDocument();
  });

  it("uses a bottom sheet on mobile", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    const user = await openTools();
    expect(screen.getByRole("dialog", { name: "Quick tools" })).toHaveAttribute("data-side", "bottom");
    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("hands off from the mobile sheet to Add people", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    const user = await openTools();
    await user.click(screen.getByRole("button", { name: "Add people" }));
    await waitFor(() => expect(screen.getByTestId("destination")).toHaveTextContent("add-beneficiary"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it.each([
    ["Quick note", "quick-capture"],
    ["Add people", "add-beneficiary"],
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

it("uses a frosted music panel with contrasting volume controls", async () => {
  const user = await openTools();
  const musicPanel = screen.getByRole("region", { name: "Music player" });
  expect(musicPanel).toHaveClass("music-player-panel", "border-stroke-neutral-weak");
  expect(musicPanel.closest(".quick-tools-panel")).toBeInTheDocument();
  const fills = [...musicPanel.querySelectorAll<HTMLElement>("[style]")].map((e) => e.style.backgroundColor);
  expect(fills).toContain("var(--stroke-neutral-weak)");
  expect(fills).toContain("var(--icon-neutral-weak)");
  expect(fills).toContain("var(--icon-neutral-strong)");
  const slider = within(musicPanel).getByRole("slider", { name: "Volume" });
  slider.focus();
  await user.keyboard("{ArrowRight}");
  expect(music.setVolume).toHaveBeenCalledWith(51);
});

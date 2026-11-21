import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import FilePreview from ".";

const close = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/use-modal", async (original) => ({
  ...(await original<typeof import("@/hooks/use-modal")>()),
  useModal: () => ({ close, open: vi.fn() }),
}));
vi.mock("@/hooks/use-fetcher", () => ({ default: () => ({ trigger: vi.fn(), isMutating: false }) }));
const refreshLink = vi.hoisted(() => vi.fn(async () => ({ url: "/fresh-call.m4a" })));
vi.mock("@/features/media/signed-media-access", () => ({ useSignedMediaAccess: (file: { url: string }) => ({ src: file.url, onError: refreshLink }) }));

const call = { _id: "call", name: "voice_call_1795000000000.m4a", type: "audio/mp4", url: "/call.m4a", size: 10, duration: 115 };

describe("FilePreview recordings", () => {
  beforeEach(() => close.mockClear());

  it("opens a recorded conversation as a full page: story title, date, Download and Delete, and the header's close", async () => {
    renderWithProviders(<FilePreview data={{ files: [call], title: "Teaching my daughter to ride a bike", storyId: "story-1" }} />, { route: "/stories", auth: true });

    const page = await screen.findByRole("dialog", { name: "Teaching my daughter to ride a bike" });
    expect(page).toHaveClass("insights-overlay");
    expect(page.querySelector("[data-slot='dashboard-overlay-header']")).toHaveTextContent("Voice conversation");
    expect(screen.getByRole("region", { name: "Player" })).toBeInTheDocument();
    // Weak-fill buttons; the fill is the theme's own (light sky gets a quiet tint).
    expect(screen.getByRole("button", { name: "Download" })).toHaveClass("bg-fill-neutral-weak", "transcript-quiet-fill");
    // 24px regular serif title, and the story's identicon in the player.
    expect(screen.getByRole("heading", { name: "Teaching my daughter to ride a bike" })).toHaveClass("text-2xl", "font-normal");
    expect(screen.getByTestId("audio-identicon")).toHaveAttribute("src", "https://api.dicebear.com/10.x/disco/svg?seed=story-1");

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(await screen.findByRole("alertdialog", { name: "Delete this recording?" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Keep it" }));

    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(close).toHaveBeenCalledWith("file-preview");
  });

  it("names a recording without a story title by its kind", async () => {
    renderWithProviders(<FilePreview data={{ files: [call], readOnly: true }} />, { route: "/stories", auth: true });
    expect(await screen.findByRole("dialog", { name: "Voice conversation" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("downloads with a fresh link when the saved one has expired", async () => {
    const fetchMock = vi.fn(async (url: string) => url === "/fresh-call.m4a"
      ? { ok: true, status: 200, blob: async () => new Blob(["audio"]) }
      : { ok: false, status: 403 });
    vi.stubGlobal("fetch", fetchMock);
    URL.createObjectURL = vi.fn(() => "blob:call");
    URL.revokeObjectURL = vi.fn();
    const clicked = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    try {
      renderWithProviders(<FilePreview data={{ files: [call] }} />, { route: "/stories", auth: true });
      await userEvent.click(await screen.findByRole("button", { name: "Download" }));
      await vi.waitFor(() => expect(clicked).toHaveBeenCalled());
      expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(["/call.m4a", "/fresh-call.m4a"]);
      expect(refreshLink).toHaveBeenCalled();
    } finally {
      clicked.mockRestore();
      vi.unstubAllGlobals();
    }
  });
});

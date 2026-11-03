import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders, server } from "@/test";
import { postFetcher } from "@/api/fetcher";
import { useState } from "react";
import { QuickCapture } from "./index";

const voice = vi.hoisted(() => ({
  phase: "idle",
  seconds: 4,
  levels: [5, 16, 28],
  error: "",
  canRetry: false,
  start: vi.fn(),
  stop: vi.fn(),
  cancel: vi.fn(),
  retry: vi.fn(),
  togglePause: vi.fn(),
}));
let receive: (text: string) => void;
vi.mock("@/pages/dashboard/overview/sections/use-overview-dictation", () => ({
  useOverviewDictation: (callback: typeof receive) => {
    receive = callback;
    return voice;
  },
}));
vi.mock("@emoji-mart/react", () => ({ default: () => null }));
vi.mock("@/contexts/feature-flags", () => ({
  useFeatureFlags: () => ({ canUse: () => true }),
}));
vi.mock("@/api/fetcher", async (original) => ({
  ...(await original<typeof import("@/api/fetcher")>()),
  postFetcher: vi.fn(),
}));
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  voice.phase = "idle";
  voice.error = "";
  voice.canRetry = false;
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: true,
  });
  vi.mocked(postFetcher).mockResolvedValue({
    success: true,
    message: "Saved",
    data: {},
  });
  server.use(
    http.get("*/groups", () =>
      HttpResponse.json({
        success: true,
        data: {
          docs: [{ _id: "group-1", name: "Family" }],
          totalDocs: 1,
          page: 1,
          limit: 100,
        },
      }),
    ),
  );
});
it("hides the avatar while typing and restores it when cleared", () => {
  renderWithProviders(<QuickCapture />);
  expect(screen.getByTestId("quick-story-avatar")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
  fireEvent.change(screen.getByRole("textbox", { name: "Story" }), {
    target: { value: "A memory" },
  });
  expect(screen.queryByTestId("quick-story-avatar")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Publish" })).toBeEnabled();
  fireEvent.change(screen.getByRole("textbox", { name: "Story" }), {
    target: { value: "" },
  });
  expect(screen.getByTestId("quick-story-avatar")).toBeInTheDocument();
});
it.each(["everyone", "group"])(
  "publishes %s access through the existing story endpoint",
  async (kind) => {
    const user = userEvent.setup();
    renderWithProviders(<QuickCapture />, { auth: true });
    fireEvent.change(screen.getByRole("textbox", { name: "Story" }), {
      target: { value: "A shared memory" },
    });
    await user.click(screen.getByRole("button", { name: "Choose visibility" }));
    if (kind === "everyone")
      await user.click(screen.getByRole("button", { name: "Everyone" }));
    else
      await user.click(await screen.findByRole("checkbox", { name: "Family" }));
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Publish" }));
    await waitFor(() =>
      expect(postFetcher).toHaveBeenCalledWith(
        "/memories",
        expect.objectContaining({
          arg: expect.objectContaining({
            visibility: kind === "everyone" ? "everyone" : "private",
            groups: kind === "group" ? ["group-1"] : [],
            capture_source: "quick",
            status: "save",
          }),
        }),
      ),
    );
  },
);
it("uses shared dictation controls and appends the transcript to the existing story", async () => {
  let refresh!: () => void;
  function Harness() {
    const [, update] = useState(0);
    refresh = () => update((n) => n + 1);
    return <QuickCapture />;
  }
  renderWithProviders(<Harness />);
  fireEvent.change(screen.getByRole("textbox", { name: "Story" }), {
    target: { value: "Earlier thought." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Record voice" }));
  expect(voice.start).toHaveBeenCalledOnce();
  voice.phase = "recording";
  act(() => refresh());
  expect(
    screen.queryByRole("button", { name: "Choose visibility" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Pause recording" }));
  expect(voice.togglePause).toHaveBeenCalledOnce();
  fireEvent.click(
    screen.getByRole("button", { name: "Stop recording and transcribe" }),
  );
  expect(voice.stop).toHaveBeenCalledOnce();
  voice.phase = "transcribing";
  act(() => refresh());
  expect(screen.getByRole("status")).toHaveTextContent("Transcribing…");
  act(() => receive("A new thought."));
  voice.phase = "idle";
  act(() => refresh());
  expect(screen.getByRole("textbox", { name: "Story" })).toHaveValue(
    "Earlier thought. A new thought.",
  );
});
it("exposes retry and discard for a failed transcription", () => {
  voice.error = "Couldn’t transcribe";
  voice.canRetry = true;
  renderWithProviders(<QuickCapture />);
  fireEvent.click(screen.getByRole("button", { name: "Retry transcription" }));
  expect(voice.retry).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole("button", { name: "Discard recording" }));
  expect(voice.cancel).toHaveBeenCalledOnce();
});

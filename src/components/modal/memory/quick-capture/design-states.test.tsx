import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders, server } from "@/test";
import { fileUploadFetcher, postFetcher } from "@/api/fetcher";
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
let receive: (file: File, durationSeconds: number) => void;
vi.mock("@/hooks/use-voice-capture", () => ({
  useVoiceCapture: ({ mode, onAudio }: { mode: string; onAudio: typeof receive }) => {
    expect(mode).toBe("audio");
    receive = onAudio;
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
  fileUploadFetcher: vi.fn().mockResolvedValue({
    success: true,
    data: { _id: "voice-1", name: "voice.webm", url: "https://x/voice.webm", size: 5, type: "audio/webm" },
  }),
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
it("offers the Add Story upload options and opens the document picker", async () => {
  const user = userEvent.setup();
  renderWithProviders(<QuickCapture />);
  const input = screen.getByLabelText("Upload documents");
  const openPicker = vi.spyOn(input, "click");
  await user.click(screen.getByRole("button", { name: "Add attachment" }));
  expect(screen.getByText("Choose upload type")).toBeVisible();
  expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
    "Photos", "Videos", "Audio", "Documents",
  ]);
  await user.click(screen.getByRole("menuitem", { name: "Documents" }));
  expect(openPicker).toHaveBeenCalledOnce();
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
});

it("shows no avatar and enables Publish only once there is text", () => {
  renderWithProviders(<QuickCapture />);
  expect(screen.queryByAltText("Your avatar")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
  fireEvent.change(screen.getByRole("textbox", { name: "Story" }), {
    target: { value: "A memory" },
  });
  expect(screen.getByRole("button", { name: "Publish" })).toBeEnabled();
  fireEvent.change(screen.getByRole("textbox", { name: "Story" }), {
    target: { value: "" },
  });
  expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
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
it("uses shared recorder controls and keeps the audio without changing the story text", async () => {
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
  expect(screen.queryByRole("button", { name: /pause recording|resume recording/i })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Cancel recording" })).toBeEnabled();
  fireEvent.click(
    screen.getByRole("button", { name: "Stop recording" }),
  );
  expect(voice.stop).toHaveBeenCalledOnce();
  voice.phase = "saving";
  act(() => refresh());
  expect(screen.getByRole("status")).toHaveTextContent("Saving…");
  act(() => receive(new File(["audio"], "voice.webm", { type: "audio/webm" }), 8));
  voice.phase = "idle";
  act(() => refresh());
  // The audio is kept as an attachment and the note's text is left alone.
  expect(screen.getByRole("textbox", { name: "Story" })).toHaveValue(
    "Earlier thought.",
  );
  await waitFor(() => expect(fileUploadFetcher).toHaveBeenCalled());
  expect(fileUploadFetcher).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      arg: expect.objectContaining({ duration: 8, file: expect.any(File) }),
    }),
  );
});

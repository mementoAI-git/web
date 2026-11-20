import { toast } from "sonner";
import { beforeEach, expect, it, vi } from "vitest";
import { useReducer } from "react";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router-dom";
import { renderWithProviders } from "@/test";
import { useModal } from "@/hooks/use-modal";
import { deleteFetcher, fileUploadFetcher, postFetcher } from "@/api/fetcher";
import endpoint from "@/api/endpoint";
import { OverviewCaptureCard } from "./overview-capture-card";
vi.mock("@/api/fetcher", async (original) => ({
  ...(await original<typeof import("@/api/fetcher")>()),
  postFetcher: vi.fn(),
  fileUploadFetcher: vi.fn(),
  deleteFetcher: vi.fn(),
}));
let finishRecording: (file: File, durationSeconds: number) => void;
let phase: "idle" | "starting" | "recording" | "paused" | "saving" = "idle";
const cancel = vi.fn();
const retry = vi.fn();
let captureError = "";
let canRetry = false;
vi.mock("@/hooks/use-voice-capture", () => ({
  useVoiceCapture: ({ mode, onAudio }: { mode: string; onAudio: typeof finishRecording }) => {
    expect(mode).toBe("audio");
    finishRecording = onAudio;
    return {
      phase,
      error: captureError,
      canRetry,
      retry,
      start: vi.fn(),
      cancel,
      seconds: 0,
      levels: Array(87).fill(5),
      stop: vi.fn(),
      togglePause: vi.fn(),
    };
  },
}));
function State() {
  const { state, close } = useModal();
  const location = useLocation();
  return (
    <>
      <output data-testid="modal">{JSON.stringify(state)}</output>
      <output data-testid="route">
        {JSON.stringify({ path: location.pathname, state: location.state })}
      </output>
      <button onClick={() => close?.()}>Close editor</button>
    </>
  );
}
beforeEach(() => {
  localStorage.clear();
  phase = "idle";
  cancel.mockClear();
  retry.mockClear();
  captureError = "";
  canRetry = false;
  vi.spyOn(toast, "error").mockClear();
  vi.spyOn(toast, "success").mockClear();
  vi.mocked(postFetcher).mockReset();
  vi.mocked(deleteFetcher).mockReset().mockResolvedValue({ success: true } as never);
  vi.mocked(fileUploadFetcher).mockReset().mockResolvedValue({
    success: true,
    data: { _id: "voice-1", name: "voice.webm", url: "https://x/voice.webm", size: 5, type: "audio/webm" },
  } as never);
});
it("records in a floating window and preserves the draft on cancel", async () => {
  let refresh: () => void;
  function Harness() {
    const [, update] = useReducer((value: number) => value + 1, 0);
    refresh = update;
    return <OverviewCaptureCard userId="a" onVoiceConversation={vi.fn()} />;
  }
  const user = userEvent.setup();
  renderWithProviders(<Harness />);
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "My draft" },
  });
  act(() => {
    phase = "starting";
    refresh();
  });
  const recorder = screen.getByRole("dialog", { name: "New recording" });
  expect(recorder.parentElement).toBe(document.body);
  expect(screen.getByTestId("overview-capture-card")).not.toContainElement(recorder);
  expect(screen.getByRole("status")).toHaveTextContent("Preparing microphone…");
  expect(screen.getByRole("textbox")).toHaveValue("My draft");
  expect(screen.getByRole("button", { name: "Use as story" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Record more" })).toBeDisabled();
  const stop = screen.getByRole("button", { name: "Done" });
  const pause = screen.getByRole("button", { name: "Pause recording" });
  expect(stop).toBeDisabled();
  expect(pause).toBeDisabled();
  const cancelButton = screen.getByRole("button", { name: "Cancel recording" });
  expect(cancelButton).toBeEnabled();
  act(() => {
    phase = "recording";
    refresh();
  });
  expect(screen.getByRole("button", { name: "Done" })).toBe(stop);
  expect(screen.getByRole("button", { name: "Cancel recording" })).toBe(
    cancelButton,
  );
  expect(screen.getByRole("textbox")).toHaveValue("My draft");
  expect(stop).toBeEnabled();
  expect(pause).toBeEnabled();
  expect(pause.querySelector("svg")).not.toHaveClass("lucide-play");
  act(() => {
    phase = "paused";
    refresh();
  });
  expect(screen.getByRole("button", { name: "Resume recording" })).toBe(pause);
  expect(pause).toHaveAttribute("aria-pressed", "true");
  expect(pause.querySelector("svg")).toHaveClass("lucide-play");
  await user.click(cancelButton);
  expect(cancel).toHaveBeenCalledOnce();
  act(() => {
    phase = "idle";
    refresh();
  });
  expect(screen.queryByRole("dialog", { name: "New recording" })).not.toBeInTheDocument();
  expect(screen.getByRole("textbox")).toHaveValue("My draft");
});
it("prefills the story with every line, escapes markup and preserves the draft after closing", async () => {
  const user = userEvent.setup();
  renderWithProviders(
    <>
      <OverviewCaptureCard userId="a" onVoiceConversation={vi.fn()} />
      <State />
    </>,
  );
  const text = "One <important> memory\n\nWith family & friends.";
  fireEvent.change(screen.getByRole("textbox"), { target: { value: text } });
  await user.click(screen.getByRole("button", { name: "Use as story" }));
  const modal = JSON.parse(screen.getByTestId("modal").textContent!);
  expect(modal[0].name).toBe("create-memory");
  expect(modal[0].props.payload.body).toBe(
    "<p>One &lt;important&gt; memory</p><p></p><p>With family &amp; friends.</p>",
  );
  await user.click(screen.getByText("Close editor"));
  expect(screen.getByRole("textbox")).toHaveValue(text);
  expect(localStorage.getItem("memento-overview-draft:a")).toBe(text);
});
it("keeps users’ drafts separate", () => {
  localStorage.setItem("memento-overview-draft:a", "Private draft");
  renderWithProviders(
    <OverviewCaptureCard userId="b" onVoiceConversation={vi.fn()} />,
  );
  expect(screen.getByRole("textbox")).toHaveValue("");
});
it("passes the full discussion text privately in router state", async () => {
  const user = userEvent.setup();
  renderWithProviders(
    <>
      <OverviewCaptureCard userId="a" onVoiceConversation={vi.fn()} />
      <State />
    </>,
  );
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "Let’s reflect on this." },
  });
  await user.click(screen.getByRole("button", { name: "Discuss" }));
  const route = JSON.parse(screen.getByTestId("route").textContent!);
  expect(route).toEqual({
    path: "/chat",
    state: { overviewDiscussion: "Let’s reflect on this." },
  });
});
it("shows exactly the design actions and clears only after confirmation", async () => {
  const user = userEvent.setup();
  renderWithProviders(
    <OverviewCaptureCard userId="a" onVoiceConversation={vi.fn()} />,
  );
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "A draft" },
  });
  expect(
    screen
      .getAllByRole("button")
      .map((button) => button.getAttribute("aria-label") || button.textContent),
  ).toEqual([
    "Save now",
    "Use as story",
    "Discuss",
    "Clear text",
    "Record more",
  ]);
  expect(
    screen.queryByText(/Draft saved on this device/),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Clear text" }));
  expect(screen.getByRole("textbox", { hidden: true })).toHaveValue("A draft");
  await user.click(screen.getByRole("button", { name: "Clear text" }));
  expect(screen.getByRole("textbox")).toHaveValue("");
  expect(localStorage.getItem("memento-overview-draft:a")).toBeNull();
});
it("saves the full text privately using quick capture", async () => {
  const user = userEvent.setup();
  vi.mocked(postFetcher).mockResolvedValue({
    success: true,
    data: { _id: "saved" },
    message: "Saved",
  });
  renderWithProviders(
    <OverviewCaptureCard userId="a" onVoiceConversation={vi.fn()} />,
  );
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "One <memory>\nTwo & friends." },
  });
  await user.click(screen.getByRole("button", { name: "Save now" }));
  expect(postFetcher).toHaveBeenCalledWith(
    endpoint.memoriesQuickCapture,
    expect.objectContaining({
      arg: {
        body: "<p>One &lt;memory&gt;</p><p>Two &amp; friends.</p>",
        visibility: "private",
      },
    }),
  );
  expect(toast.success).toHaveBeenCalledWith("Quick note saved. Details will finish processing in the background.");
  expect(screen.getByRole("textbox")).toHaveValue("");
});
it("preserves the text if saving fails", async () => {
  const user = userEvent.setup();
  vi.mocked(postFetcher).mockRejectedValue(new Error("Offline"));
  renderWithProviders(
    <OverviewCaptureCard userId="a" onVoiceConversation={vi.fn()} />,
  );
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "My memory" },
  });
  await user.click(screen.getByRole("button", { name: "Save now" }));
  expect(screen.getByRole("textbox")).toHaveValue("My memory");
});

it("grows with typed lines up to nine before scrolling", () => {
  renderWithProviders(
    <OverviewCaptureCard userId="a" onVoiceConversation={vi.fn()} />,
  );
  const input = screen.getByRole("textbox");
  let contentHeight = 34;
  Object.defineProperty(input, "scrollHeight", {
    configurable: true,
    get: () => contentHeight,
  });
  contentHeight = 136;
  fireEvent.change(input, { target: { value: "One\nTwo\nThree\nFour" } });
  expect(input).toHaveStyle({ height: "136px", overflowY: "hidden" });
  contentHeight = 306;
  fireEvent.change(input, { target: { value: "One\nTwo\nThree\nFour\nFive\nSix\nSeven\nEight" } });
  expect(input).toHaveStyle({ height: "306px", overflowY: "hidden" });
  contentHeight = 340;
  fireEvent.change(input, {
    target: { value: Array(10).fill("Line").join("\n") },
  });
  expect(input).toHaveStyle({ height: "306px", overflowY: "auto" });
  contentHeight = 34;
  fireEvent.change(input, { target: { value: "" } });
  expect(input).toHaveStyle({ height: "34px", overflowY: "hidden" });
});




it("reports no speech using a toast without adding an error to the card", () => {
  captureError = "No speech was detected. Try recording again.";
  renderWithProviders(
    <OverviewCaptureCard userId="a" onVoiceConversation={vi.fn()} />,
  );
  expect(toast.error).toHaveBeenCalledWith(captureError, expect.any(Object));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.queryByText(captureError)).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Record your thoughts" }),
  ).toBeEnabled();
});
it("keeps a draft in the card and toasts when device storage fails", () => {
  const storage = vi
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new Error("Storage full");
    });
  try {
    renderWithProviders(
      <OverviewCaptureCard userId="a" onVoiceConversation={vi.fn()} />,
    );
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "A thought worth keeping" },
    });
    expect(screen.getByRole("textbox")).toHaveValue("A thought worth keeping");
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("Draft couldn’t be saved"),
      expect.any(Object),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  } finally {
    storage.mockRestore();
  }
});

it("hides the placeholder on focus and restores it when an empty field loses focus", async () => {
  const user = userEvent.setup();
  renderWithProviders(
    <OverviewCaptureCard userId="a" onVoiceConversation={vi.fn()} />,
  );
  const field = screen.getByRole("textbox", { name: "Your thoughts" });
  expect(field).toHaveAttribute("placeholder", "What’s on your mind today?");
  await user.click(field);
  expect(field).toHaveAttribute("placeholder", "");
  await user.tab();
  expect(field).toHaveAttribute("placeholder", "What’s on your mind today?");
});

it("focuses the editor from the empty space above the controls", async () => {
  const user = userEvent.setup();
  renderWithProviders(
    <OverviewCaptureCard userId="a" onVoiceConversation={vi.fn()} />,
  );
  await user.click(screen.getByTestId("capture-writing-area"));
  const field = screen.getByRole("textbox", { name: "Your thoughts" });
  expect(field).toHaveFocus();
  await user.keyboard("A thought worth keeping");
  expect(field).toHaveValue("A thought worth keeping");
  await user.click(screen.getByRole("button", { name: "Use as story" }));
  expect(field).not.toHaveFocus();
});

it("does not focus the draft by clicking recording space while recording", async () => {
  phase = "recording";
  localStorage.setItem("memento-overview-draft:a", "Existing draft");
  const user = userEvent.setup();
  renderWithProviders(
    <OverviewCaptureCard userId="a" onVoiceConversation={vi.fn()} />,
  );
  await user.click(screen.getByTestId("overview-capture-card"));
  expect(screen.getByRole("textbox")).not.toHaveFocus();
  expect(screen.getByRole("textbox")).toHaveValue("Existing draft");
});
const recordedFile = () => new File(["audio"], "voice.webm", { type: "audio/webm" });
/** A recording whose automatic save failed, so it's kept on the card. */
async function recordVoiceNote() {
  vi.mocked(postFetcher).mockResolvedValueOnce({ success: false, message: "Offline" });
  act(() => finishRecording(recordedFile(), 12));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Save now" })).toBeEnabled(),
  );
}
it("saves a finished recording to stories straight away, for the AI to name, like mobile", async () => {
  vi.mocked(postFetcher).mockResolvedValue({
    success: true,
    data: { _id: "saved" },
    message: "Quick note saved",
  });
  renderWithProviders(<OverviewCaptureCard userId="a" onVoiceConversation={vi.fn()} />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Unrelated draft" } });
  act(() => finishRecording(recordedFile(), 12));
  await waitFor(() =>
    expect(toast.success).toHaveBeenCalledWith(
      "Recording saved. We’ll name it once it’s transcribed.",
      expect.anything(),
    ),
  );
  expect(fileUploadFetcher).toHaveBeenCalledWith(
    endpoint.upload,
    expect.objectContaining({
      arg: expect.objectContaining({ file: expect.any(File), duration: 12 }),
    }),
  );
  expect(postFetcher).toHaveBeenCalledWith(
    endpoint.memoriesQuickCapture,
    expect.objectContaining({
      arg: { attachments: ["voice-1"], visibility: "private", auto_title: true },
    }),
  );
  // It never joins the card, and the typed draft is left alone.
  expect(screen.queryByRole("button", { name: "Remove attachment" })).not.toBeInTheDocument();
  expect(screen.getByRole("textbox")).toHaveValue("Unrelated draft");
  expect(localStorage.getItem("memento-overview-voice:a")).toBeNull();
});
it("keeps a recording on the card when saving fails, and still names it when saved from there", async () => {
  const user = userEvent.setup();
  renderWithProviders(<OverviewCaptureCard userId="a" onVoiceConversation={vi.fn()} />);
  await recordVoiceNote();
  expect(toast.error).toHaveBeenCalledWith(
    "Couldn’t save your recording. It’s kept on this card, so you can save it from there.",
    expect.anything(),
  );
  expect(localStorage.getItem("memento-overview-voice:a")).not.toBeNull();
  vi.mocked(postFetcher).mockResolvedValueOnce({ success: true, data: { _id: "saved" }, message: "Quick note saved" });
  await user.click(screen.getByRole("button", { name: "Save now" }));
  expect(postFetcher).toHaveBeenLastCalledWith(
    endpoint.memoriesQuickCapture,
    expect.objectContaining({
      arg: { attachments: ["voice-1"], auto_title: true, visibility: "private" },
    }),
  );
  await waitFor(() =>
    expect(screen.queryByRole("button", { name: "Save now" })).not.toBeInTheDocument(),
  );
  expect(localStorage.getItem("memento-overview-voice:a")).toBeNull();
});
it("restores an unsaved recording after remounting", async () => {
  const view = renderWithProviders(<OverviewCaptureCard userId="a" onVoiceConversation={vi.fn()} />);
  await recordVoiceNote();
  view.unmount();
  renderWithProviders(<OverviewCaptureCard userId="a" onVoiceConversation={vi.fn()} />);
  expect(await screen.findByRole("button", { name: "Save now" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Record more" })).toBeEnabled();
});
it("carries the recording into the story when using it as a story", async () => {
  const user = userEvent.setup();
  renderWithProviders(
    <>
      <OverviewCaptureCard userId="a" onVoiceConversation={vi.fn()} />
      <State />
    </>,
  );
  await recordVoiceNote();
  await user.click(screen.getByRole("button", { name: "Use as story" }));
  expect(screen.getByTestId("modal").textContent).toContain('"_id":"voice-1"');
});
it("deletes the uploaded recording when the draft is cleared", async () => {
  const user = userEvent.setup();
  renderWithProviders(<OverviewCaptureCard userId="a" onVoiceConversation={vi.fn()} />);
  await recordVoiceNote();
  await user.click(screen.getByRole("button", { name: "Clear text" }));
  await user.click(screen.getByRole("button", { name: "Clear text" }));
  expect(deleteFetcher).toHaveBeenCalledOnce();
  expect(screen.queryByRole("button", { name: "Save now" })).not.toBeInTheDocument();
});
function ModalProbe({ onState }: { onState: (state: unknown) => void }) {
  const { state } = useModal();
  onState(state);
  return null;
}
async function useAsStory() {
  let modals: { props: { onHandedOff: (outcome: "published" | "draft") => void } }[] = [];
  renderWithProviders(
    <>
      <OverviewCaptureCard userId="a" onVoiceConversation={vi.fn()} />
      <ModalProbe onState={(state) => { modals = state as typeof modals; }} />
    </>,
  );
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "My note" } });
  await recordVoiceNote();
  await userEvent.click(screen.getByRole("button", { name: "Use as story" }));
  return modals[0].props.onHandedOff;
}
it("clears the card once its draft is published as a story, so it can't be saved twice", async () => {
  const handOff = await useAsStory();
  expect(screen.getByRole("textbox")).toHaveValue("My note");
  act(() => handOff("published"));
  await waitFor(() =>
    expect(screen.queryByRole("button", { name: "Save now" })).not.toBeInTheDocument(),
  );
  expect(screen.getByRole("textbox")).toHaveValue("");
  expect(localStorage.getItem("memento-overview-draft:a")).toBeNull();
  expect(localStorage.getItem("memento-overview-voice:a")).toBeNull();
  expect(deleteFetcher).not.toHaveBeenCalled();
});
it("says where the draft went when the story was kept in Drafts", async () => {
  const handOff = await useAsStory();
  act(() => handOff("draft"));
  await waitFor(() => expect(screen.getByRole("textbox")).toHaveValue(""));
  expect(toast.success).toHaveBeenCalledWith("Moved to your story drafts.");
  expect(deleteFetcher).not.toHaveBeenCalled();
});
it("keeps text typed after the hand-off", async () => {
  const handOff = await useAsStory();
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Something newer" } });
  act(() => handOff("published"));
  await waitFor(() =>
    expect(localStorage.getItem("memento-overview-voice:a")).toBeNull(),
  );
  expect(screen.getByRole("textbox")).toHaveValue("Something newer");
});

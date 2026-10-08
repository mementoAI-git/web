import { toast } from "sonner";
import { beforeEach, expect, it, vi } from "vitest";
import { useReducer } from "react";
import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router-dom";
import { renderWithProviders } from "@/test";
import { useModal } from "@/hooks/use-modal";
import { postFetcher } from "@/api/fetcher";
import endpoint from "@/api/endpoint";
import { OverviewCaptureCard } from "./overview-capture-card";
vi.mock("@/api/fetcher", async (original) => ({
  ...(await original<typeof import("@/api/fetcher")>()),
  postFetcher: vi.fn(),
}));
let append: (text: string) => void;
let phase: "idle" | "starting" | "recording" | "transcribing" = "idle";
const cancel = vi.fn();
const retry = vi.fn();
let captureError = "";
let canRetry = false;
vi.mock("./use-overview-dictation", () => ({
  useOverviewDictation: (callback: typeof append) => {
    append = callback;
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
  vi.mocked(postFetcher).mockReset();
});
it("uses the recording shell while the microphone starts and preserves the draft on cancel", async () => {
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
  expect(screen.getByRole("status")).toHaveTextContent("Preparing microphone…");
  expect(screen.getByRole("textbox")).toHaveValue("My draft");
  expect(
    screen.queryByRole("button", { name: "Use as story" }),
  ).not.toBeInTheDocument();
  const stop = screen.getByRole("button", {
    name: "Stop recording and transcribe",
  });
  const pause = screen.getByRole("button", { name: "Pause recording" });
  expect(stop).toBeDisabled();
  expect(pause).toBeDisabled();
  const cancelButton = screen.getByRole("button", { name: "Cancel recording" });
  expect(cancelButton).toBeEnabled();
  act(() => {
    phase = "recording";
    refresh();
  });
  expect(
    screen.getByRole("button", { name: "Stop recording and transcribe" }),
  ).toBe(stop);
  expect(screen.getByRole("button", { name: "Cancel recording" })).toBe(
    cancelButton,
  );
  expect(screen.getByRole("textbox")).toHaveValue("My draft");
  expect(stop).toBeEnabled();
  expect(pause).toBeEnabled();
  await user.click(cancelButton);
  expect(cancel).toHaveBeenCalledOnce();
  act(() => {
    phase = "idle";
    refresh();
  });
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
it("appends speech to the latest edited draft and restores it on remount", () => {
  const view = renderWithProviders(
    <OverviewCaptureCard userId="a" onVoiceConversation={vi.fn()} />,
  );
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "Edited thoughts" },
  });
  act(() => append("Recorded thoughts"));
  expect(screen.getByRole("textbox")).toHaveValue(
    "Edited thoughts Recorded thoughts",
  );
  view.unmount();
  renderWithProviders(
    <OverviewCaptureCard userId="a" onVoiceConversation={vi.fn()} />,
  );
  expect(screen.getByRole("textbox")).toHaveValue(
    "Edited thoughts Recorded thoughts",
  );
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
it("saves the full transcript privately using quick capture", async () => {
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
  expect(screen.getByRole("textbox")).toHaveValue("");
});
it("preserves the transcript if saving fails", async () => {
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

it("grows with typed or transcribed lines up to nine before scrolling", () => {
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
  act(() => append("Five\nSix\nSeven\nEight"));
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

it("keeps earlier transcripts visible through another recording and continues in the same paragraph", () => {
  let refresh: () => void;
  function Harness() {
    const [, update] = useReducer((value: number) => value + 1, 0);
    refresh = update;
    return <OverviewCaptureCard userId="a" onVoiceConversation={vi.fn()} />;
  }
  renderWithProviders(<Harness />);
  act(() => append("First memory."));
  for (const next of ["starting", "recording", "transcribing"] as const) {
    act(() => {
      phase = next;
      refresh();
    });
    if (next === "transcribing") {
      expect(screen.getByRole("textbox")).toHaveTextContent("First memory.");
    } else {
      expect(screen.getByRole("textbox")).toHaveValue("First memory.");
    }
  }
  act(() => {
    append("Second memory.");
    phase = "idle";
    refresh();
  });
  expect(screen.getByRole("textbox")).toHaveValue(
    "First memory. Second memory.",
  );
});
it("preserves an intentional paragraph break when appending speech", () => {
  renderWithProviders(
    <OverviewCaptureCard userId="a" onVoiceConversation={vi.fn()} />,
  );
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "First memory.\n\n" },
  });
  act(() => append("  Second memory.  "));
  expect(screen.getByRole("textbox")).toHaveValue(
    "First memory.\n\nSecond memory.",
  );
});

it("shows a small loader and transcription label without a placeholder for the first recording", () => {
  phase = "transcribing";
  renderWithProviders(
    <OverviewCaptureCard userId="a" onVoiceConversation={vi.fn()} />,
  );
  expect(
    screen.queryByPlaceholderText("What’s on your mind today?"),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("status", { name: "Transcribing" }),
  ).toHaveTextContent("Transcribing…");
  expect(
    screen.getByRole("status", { name: "Transcribing" }).querySelector("svg"),
  ).toHaveClass("animate-spin", "size-4");
  expect(
    screen.getByRole("button", { name: "Stop recording and transcribe" }),
  ).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Pause recording" }),
  ).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Cancel recording" }),
  ).toBeEnabled();
  expect(
    screen.queryByRole("button", { name: "Add story" }),
  ).not.toBeInTheDocument();
});
it("places only an animated loader inline after existing text during additional transcription", () => {
  phase = "transcribing";
  localStorage.setItem(
    "memento-overview-draft:a",
    "First memory.\nAnother thought.",
  );
  renderWithProviders(
    <OverviewCaptureCard userId="a" onVoiceConversation={vi.fn()} />,
  );
  const text = screen.getByRole("textbox", { name: "Your thoughts" });
  expect(text).toHaveAttribute("aria-readonly", "true");
  expect(text).toHaveTextContent("First memory. Another thought.");
  const loader = screen.getByRole("status", {
    name: "Transcribing additional recording",
  });
  expect(loader).toHaveClass("inline-block", "animate-spin");
  expect(text.lastElementChild).toBe(loader);
  expect(screen.queryByText("Transcribing…")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Cancel" }),
  ).not.toBeInTheDocument();
});

it("continues an unfinished sentence without duplicating spaces and keeps transcript paragraphs", () => {
  renderWithProviders(
    <OverviewCaptureCard userId="a" onVoiceConversation={vi.fn()} />,
  );
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "I remember " },
  });
  act(() => append("a warm afternoon.\n\nYears later, we returned."));
  expect(screen.getByRole("textbox")).toHaveValue(
    "I remember a warm afternoon.\n\nYears later, we returned.",
  );
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
it("offers retry and discard in a persistent toast instead of the card", () => {
  captureError = "Transcription service unavailable";
  canRetry = true;
  renderWithProviders(
    <OverviewCaptureCard userId="a" onVoiceConversation={vi.fn()} />,
  );
  const options = vi.mocked(toast.error).mock.calls.at(-1)?.[1];
  expect(options).toEqual(
    expect.objectContaining({
      duration: Infinity,
      action: expect.objectContaining({ label: "Retry" }),
      cancel: expect.objectContaining({ label: "Discard" }),
    }),
  );
  expect(
    screen.queryByRole("button", { name: "Retry transcription" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  if (options?.action && "onClick" in options.action)
    options.action.onClick({} as never);
  expect(retry).toHaveBeenCalledOnce();
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

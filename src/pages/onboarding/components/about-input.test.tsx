import { useState } from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { AboutInput } from "./about-input";

let transcript: (text: string) => void;
const recording = { phase: "idle", seconds: 65, levels: [5, 12], error: "", canRetry: false, start: vi.fn(), stop: vi.fn(), cancel: vi.fn(), togglePause: vi.fn(), retry: vi.fn() };
vi.mock("@/hooks/use-voice-capture", () => ({ useVoiceCapture: ({ onTranscript }: { onTranscript: (text: string) => void }) => { transcript = onTranscript; return recording; } }));
beforeEach(() => { vi.clearAllMocks(); recording.phase = "idle"; recording.error = ""; recording.canRetry = false; });

function Editor({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <AboutInput value={value} onChange={setValue} onBusyChange={vi.fn()} />;
}

it("starts recording from the inset mic and appends the transcript", () => {
  render(<Editor initial="I love music." />);
  fireEvent.click(screen.getByRole("button", { name: "Record about yourself" }));
  expect(recording.start).toHaveBeenCalledOnce();
  act(() => transcript("I also enjoy hiking."));
  expect(screen.getByRole("textbox")).toHaveValue("I love music. I also enjoy hiking.");
});

it("keeps recording and stop controls through expand and collapse", () => {
  recording.phase = "recording";
  const busy = vi.fn();
  const { rerender } = render(<AboutInput value="Hello" onChange={vi.fn()} onBusyChange={busy} />);
  expect(busy).toHaveBeenCalledWith(true);
  fireEvent.click(screen.getByRole("button", { name: "Expand introduction" }));
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getByRole("status")).toHaveTextContent("Recording");
  fireEvent.click(within(dialog).getByRole("button", { name: "Collapse introduction" }));
  expect(recording.cancel).not.toHaveBeenCalled();
  expect(recording.start).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Stop and transcribe" }));
  expect(recording.stop).toHaveBeenCalledOnce();
  recording.phase = "transcribing";
  rerender(<AboutInput value="Hello" onChange={vi.fn()} onBusyChange={busy} />);
  expect(screen.getByRole("status", { name: "Transcribing additional recording" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Record about yourself" })).toBeDisabled();
});

it("preserves and highlights excess transcript, and clears the error when edited", () => {
  const { container } = render(<Editor initial={"a".repeat(1990)} />);
  act(() => transcript("b".repeat(30)));
  expect(screen.getByRole("textbox")).toHaveValue("a".repeat(1990) + " " + "b".repeat(30));
  expect(container.querySelector('[data-excess]')).toHaveTextContent("b".repeat(21));
  expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByText("Remove 21 characters to continue.")).toBeVisible();
  expect(screen.getByRole("button", { name: "Record about yourself" })).toBeDisabled();
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Edited introduction" } });
  expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "false");
});

it("edits and records inside the overlay and keeps the edited text after collapsing", () => {
  render(<Editor initial="Hello" />);
  fireEvent.click(screen.getByRole("button", { name: "Expand introduction" }));
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "My introduction" } });
  fireEvent.click(screen.getByRole("button", { name: "Record about yourself" }));
  expect(recording.start).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole("button", { name: "Collapse introduction" }));
  expect(screen.getByRole("textbox")).toHaveValue("My introduction");
});

it("offers retry after a transcription error", () => {
  recording.error = "Try again"; recording.canRetry = true;
  render(<Editor />);
  fireEvent.click(screen.getByRole("button", { name: "Retry transcription" }));
  expect(recording.retry).toHaveBeenCalledOnce();
});


it("keeps existing text visible with an inline loader and continues the same sentence", () => {
  recording.phase = "recording";
  const onChange = vi.fn();
  const props = { value: "I remember ", onChange, onBusyChange: vi.fn() };
  const { rerender } = render(<AboutInput {...props} />);
  expect(screen.getByRole("textbox")).toHaveTextContent("I remember");
  recording.phase = "transcribing";
  rerender(<AboutInput {...props} />);
  const text = screen.getByRole("textbox");
  expect(text).toHaveAttribute("aria-readonly", "true");
  expect(text.lastElementChild).toBe(screen.getByRole("status", { name: "Transcribing additional recording" }));
  expect(screen.queryByText("Transcribing…")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Expand introduction" }));
  expect(screen.getByRole("textbox")).toHaveTextContent("I remember");
  act(() => transcript("that summer.\nWe visited family."));
  expect(onChange).toHaveBeenCalledWith("I remember that summer.\nWe visited family.");
});

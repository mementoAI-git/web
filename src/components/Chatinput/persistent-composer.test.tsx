import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import { ConversationChatinput } from "./index";
const voice = vi.hoisted(() => ({ active: true, ready: true, start: vi.fn(), send: vi.fn() }));
vi.mock("@/contexts/voice-session", () => ({ useVoiceSession: () => voice }));
beforeEach(() => { voice.active = true; vi.clearAllMocks(); voice.send.mockResolvedValue(undefined); });
it("keeps the text composer available and sends text into the active voice session", async () => {
  const user = userEvent.setup();
  const textOnlySend = vi.fn();
  renderWithProviders(<ConversationChatinput onSend={textOnlySend} memoryId="m1" />, { auth: true, route: "/chat/m1" });
  const input = screen.getByRole("textbox");
  await user.type(input, "What do you think?");
  await user.click(screen.getByRole("button", { name: "Send" }));
  await waitFor(() => expect(voice.send).toHaveBeenCalledWith({ text: "What do you think?", attachments: [] }));
  expect(textOnlySend).not.toHaveBeenCalled();
  expect(input).toHaveValue("");
  expect(screen.queryByRole("region", { name: "Voice conversation" })).not.toBeInTheDocument();
});
it("keeps a failed voice message in the composer for retry", async () => {
  voice.send.mockRejectedValueOnce(new Error("Connection lost"));
  const user = userEvent.setup();
  renderWithProviders(<ConversationChatinput onSend={vi.fn()} memoryId="m1" />, { auth: true, route: "/chat/m1" });
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: "Keep this draft" } });
  await user.click(screen.getByRole("button", { name: "Send" }));
  await waitFor(() => expect(voice.send).toHaveBeenCalledOnce());
  expect(input).toHaveValue("Keep this draft");
});

it("starts the floating session from the empty composer", async () => {
  voice.active = false;
  const user = userEvent.setup();
  renderWithProviders(<ConversationChatinput onSend={vi.fn()} memoryId="m1" />, { auth: true, route: "/chat/m1" });
  await user.click(screen.getByRole("button", { name: "Voice call" }));
  expect(voice.start).toHaveBeenCalledWith(expect.objectContaining({ memoryId: "m1" }));
  expect(screen.getByRole("textbox")).toBeInTheDocument();
});

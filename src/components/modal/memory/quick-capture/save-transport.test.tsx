import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { toast } from "sonner";
import { renderWithProviders, server } from "@/test";
import { StoreValueProvider, initialStates } from "@/hooks/use-store";
import { mockUser } from "@/test/fixtures";
import { QuickCapture } from "./index";
import { OverviewCaptureCard } from "@/pages/dashboard/overview/sections/overview-capture-card";
vi.mock("@emoji-mart/react", () => ({ default: () => null }));
vi.mock("@/contexts/feature-flags", () => ({ useFeatureFlags: () => ({ canUse: () => true }) }));

it.each(["overview", "quick-note"])("keeps the %s draft and reports one error using the real HTTP transport", async kind => {
  localStorage.clear();
  Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  server.use(http.post("http://localhost:3000/api/memories/quick-capture", () => HttpResponse.json({ message: "Save service unavailable" }, { status: 503 })));
  const error = vi.spyOn(toast, "error");
  error.mockClear();
  renderWithProviders(<StoreValueProvider value={{ ...initialStates, user: mockUser }}>
    {kind === "overview" ? <OverviewCaptureCard userId={mockUser._id} onVoiceConversation={vi.fn()} /> : <QuickCapture />}
  </StoreValueProvider>, { auth: true });
  const editor = kind === "overview" ? screen.getByRole("textbox") : screen.getByPlaceholderText("What's on your mind?");
  fireEvent.change(editor, { target: { value: "Preserve this draft" } });
  fireEvent.click(screen.getByRole("button", { name: kind === "overview" ? "Save now" : "Save", exact: true }));
  await waitFor(() => expect(error).toHaveBeenCalled());
  await waitFor(() => expect(screen.getByRole("button", { name: kind === "overview" ? "Save now" : "Save", exact: true })).toBeEnabled());
  expect(error).toHaveBeenCalledTimes(1);
  expect(error).toHaveBeenCalledWith("Save service unavailable");
  expect(editor).toHaveValue("Preserve this draft");
});

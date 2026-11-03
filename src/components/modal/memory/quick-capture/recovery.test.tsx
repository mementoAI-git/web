import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import { StoreValueProvider, initialStates } from "@/hooks/use-store";
import { mockUser } from "@/test/fixtures";
import { postFetcher, postJsonQuiet } from "@/api/fetcher";
import { QuickCapture } from "./index";
vi.mock("@emoji-mart/react", () => ({ default: () => null }));
vi.mock("@/contexts/feature-flags", () => ({
  useFeatureFlags: () => ({ canUse: () => true }),
}));
vi.mock("@/api/fetcher", async (original) => ({
  ...(await original<typeof import("@/api/fetcher")>()),
  postFetcher: vi.fn(),
  postJsonQuiet: vi.fn(),
}));
const draftKey = `quick-capture-draft:${mockUser.email}`;
const queueKey = `quick-capture-outbox:${mockUser._id}`;
function Capture() {
  return (
    <StoreValueProvider value={{ ...initialStates, user: mockUser }}>
      <QuickCapture />
    </StoreValueProvider>
  );
}
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: true,
  });
});
it("does not recreate a submitted draft when the dialog unmounts", async () => {
  vi.mocked(postFetcher).mockResolvedValue({ success: true, data: {} });
  const { unmount } = renderWithProviders(<Capture />);
  fireEvent.change(screen.getByPlaceholderText("What's on your mind?"), {
    target: { value: "A sunny memory" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Publish", exact: true }));
  await waitFor(() => expect(postFetcher).toHaveBeenCalledOnce());
  await waitFor(() => expect(localStorage.getItem(draftKey)).toBeNull());
  unmount();
  expect(localStorage.getItem(draftKey)).toBeNull();
});
it("keeps a failed draft and allows retry without inline errors", async () => {
  vi.mocked(postFetcher).mockRejectedValue(new Error("Offline"));
  const { unmount } = renderWithProviders(<Capture />);
  fireEvent.change(screen.getByPlaceholderText("What's on your mind?"), {
    target: { value: "Keep this thought" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Publish", exact: true }));
  await waitFor(() => expect(postFetcher).toHaveBeenCalledOnce());
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Publish", exact: true }),
    ).toBeEnabled(),
  );
  expect(screen.queryByText("Offline")).not.toBeInTheDocument();
  unmount();
  expect(JSON.parse(localStorage.getItem(draftKey)!).note).toBe(
    "Keep this thought",
  );
});
it("queues offline notes for the current account and clears the draft on unmount", async () => {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: false,
  });
  const { unmount } = renderWithProviders(<Capture />);
  fireEvent.change(screen.getByPlaceholderText("What's on your mind?"), {
    target: { value: "An offline thought" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Publish", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "Publish", exact: true }));
  expect(JSON.parse(localStorage.getItem(queueKey)!)).toHaveLength(1);
  expect(postFetcher).not.toHaveBeenCalled();
  unmount();
  expect(localStorage.getItem(draftKey)).toBeNull();
});
it("serializes sync, leaves other accounts untouched, and preserves newly queued notes", async () => {
  const first = { _queue_id: "one", body: "first" };
  const newer = { _queue_id: "two", body: "newer" };
  localStorage.setItem(queueKey, JSON.stringify([first]));
  localStorage.setItem("quick-capture-outbox:other", JSON.stringify([first]));
  let resolve!: (ok: boolean) => void;
  vi.mocked(postJsonQuiet).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  renderWithProviders(<Capture />);
  await waitFor(() => expect(postJsonQuiet).toHaveBeenCalledOnce());
  fireEvent(window, new Event("online"));
  expect(postJsonQuiet).toHaveBeenCalledOnce();
  localStorage.setItem(queueKey, JSON.stringify([first, newer]));
  await act(async () => {
    resolve(true);
  });
  expect(JSON.parse(localStorage.getItem(queueKey)!)).toEqual([newer]);
  expect(
    JSON.parse(localStorage.getItem("quick-capture-outbox:other")!),
  ).toEqual([first]);
});

it("restores group audience chips from a draft and keeps them when dismissed", async () => {
  const draft = {
    note: "A group memory",
    selectedBeneficiaryIds: [],
    selectedGroupIds: ["group-1"],
    visibility: "private",
  };
  localStorage.setItem(draftKey, JSON.stringify(draft));
  const { unmount } = renderWithProviders(<Capture />);
  fireEvent.click(screen.getByRole("button", { name: "Drafts" }));
  fireEvent.click(screen.getByRole("button", { name: "A group memory" }));
  expect(screen.getByRole("textbox", { name: "Story" })).toHaveValue(
    "A group memory",
  );
  expect(
    screen.getByRole("button", { name: "Choose visibility" }),
  ).toHaveTextContent("Shared with 1 selected person or group");
  unmount();
  expect(JSON.parse(localStorage.getItem(draftKey)!)).toMatchObject(draft);
});

it("queues and syncs public stories through the story endpoint", async () => {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: false,
  });
  localStorage.setItem(
    draftKey,
    JSON.stringify({ note: "A public memory", visibility: "everyone" }),
  );
  const { unmount } = renderWithProviders(<Capture />);
  fireEvent.click(screen.getByRole("button", { name: "Drafts" }));
  fireEvent.click(screen.getByRole("button", { name: "A public memory" }));
  fireEvent.click(screen.getByRole("button", { name: "Publish" }));
  expect(JSON.parse(localStorage.getItem(queueKey)!)[0]).toMatchObject({
    save_endpoint: "/memories",
    visibility: "everyone",
  });
  unmount();
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: true,
  });
  vi.mocked(postJsonQuiet).mockResolvedValue(true);
  renderWithProviders(<Capture />);
  await waitFor(() =>
    expect(postJsonQuiet).toHaveBeenCalledWith(
      "/memories",
      expect.objectContaining({
        visibility: "everyone",
        status: "save",
        capture_source: "quick",
      }),
    ),
  );
});

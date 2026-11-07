import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from "vitest";
import { act, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import { Feedback } from "./index";
import Modal from "../index";
import { useModal } from "@/hooks/use-modal";
import type { IOnUploadPayload } from "@/utility/interface";

// The host imports story previews; feedback never renders their PDF worker.
vi.mock("pdfjs-dist", () => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: {},
  version: "test",
}));

const submitFeedback = vi.fn().mockResolvedValue({ success: true });

vi.mock("@/hooks/use-fetcher", () => ({
  default: () => ({
    trigger: submitFeedback,
    isMutating: false,
  }),
}));

const uploadState: {
  files: IOnUploadPayload[];
  handleUpload: ReturnType<typeof vi.fn>;
  handleDeleteFile: ReturnType<typeof vi.fn>;
  setFiles: ReturnType<typeof vi.fn>;
} = {
  files: [],
  handleUpload: vi.fn(),
  handleDeleteFile: vi.fn(),
  setFiles: vi.fn(),
};

vi.mock("@/hooks/use-file-upload", () => ({
  default: () => ({
    files: uploadState.files,
    handleUpload: uploadState.handleUpload,
    handleDeleteFile: uploadState.handleDeleteFile,
    setFiles: uploadState.setFiles,
  }),
}));

function FeedbackHost() {
  const { open } = useModal();
  return (
    <>
      <button onClick={() => open("create-feedback")}>Open feedback</button>
      <Modal />
    </>
  );
}

describe("Feedback", () => {
  const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
  beforeAll(() => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });
  afterAll(() => {
    HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
  });
  beforeEach(() => {
    submitFeedback.mockClear();
    uploadState.files = [];
    uploadState.handleUpload.mockReset();
    uploadState.handleDeleteFile.mockReset();
    uploadState.setFiles.mockReset();
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: {
        read: vi.fn().mockRejectedValue(new Error("denied")),
        writeText: vi.fn(),
      },
    });
  });

  it("renders an accessible dialog with labelled fields and a stable submit action", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Feedback data={{}} />, { auth: true });
    const dialog = await screen.findByRole("dialog", {
      name: /send feedback/i,
    });
    expect(dialog).toHaveAccessibleDescription(
      "Share a bug, an idea, or something we could improve.",
    );
    expect(
      within(dialog).getByRole("combobox", { name: /feedback type/i }),
    ).toBeInTheDocument();
    await user.type(
      within(dialog).getByRole("textbox", { name: /^message$/i }),
      "A useful suggestion",
    );
    expect(
      within(dialog).getByRole("button", { name: /^send feedback$/i }),
    ).toBeInTheDocument();
  });

  it("shows accessible validation and submits the selected feedback type", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Feedback data={{}} />, { auth: true });
    await user.click(screen.getByRole("button", { name: /^send feedback$/i }));
    expect(await screen.findByText("Message is required")).toHaveAttribute(
      "role",
      "alert",
    );
    expect(screen.getByRole("textbox", { name: /^message$/i })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    screen.getByRole("combobox", { name: /feedback type/i }).focus();
    await user.keyboard("{Enter}");
    await user.click(
      await screen.findByRole("option", { name: "Feature Request" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: /^message$/i }),
      "Please add this feature",
    );
    await user.click(screen.getByRole("button", { name: /^send feedback$/i }));
    expect(submitFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "Feature Request",
        message: "Please add this feature",
      }),
    );
  });

  it("asks before discarding screenshots on Escape", async () => {
    const user = userEvent.setup();
    uploadState.files = [
      {
        id: "pending",
        file: new File(["x"], "pending.png", { type: "image/png" }),
        progress: 20,
      },
    ];
    renderWithProviders(<Feedback data={{}} />, { auth: true });
    expect(
      screen.getByRole("button", { name: /^send feedback$/i }),
    ).toBeDisabled();
    await user.keyboard("{Escape}");
    const confirmation = await screen.findByRole("alertdialog", {
      name: /discard feedback/i,
    });
    expect(confirmation).toHaveTextContent("Your screenshots will be removed.");
    await user.click(
      within(confirmation).getByRole("button", { name: /keep editing/i }),
    );
    expect(
      screen.getByRole("dialog", { name: /send feedback/i }),
    ).toBeInTheDocument();
  });

  it("uses one dialog in the modal host and closes on Escape", async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeedbackHost />, { auth: true });
    await user.click(screen.getByRole("button", { name: /open feedback/i }));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /^dismiss$/i })).toHaveLength(
      1,
    );
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("submits uploaded screenshots and closes without a discard prompt", async () => {
    const user = userEvent.setup();
    uploadState.files = [
      {
        id: "uploaded",
        file: new File(["x"], "image.png", { type: "image/png" }),
        progress: 100,
        uploadedFile: {
          _id: "uf1",
          name: "image.png",
          url: "https://example.com/image.png",
          size: 1,
        },
      },
    ];
    renderWithProviders(<FeedbackHost />, { auth: true });
    await user.click(screen.getByRole("button", { name: /open feedback/i }));
    await user.type(
      screen.getByRole("textbox", { name: /^message$/i }),
      "See this screenshot",
    );
    await user.click(screen.getByRole("button", { name: /^send feedback$/i }));
    expect(submitFeedback).toHaveBeenCalledWith(
      expect.objectContaining({ screenshots: ["uf1"] }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("renders thumbnail grid, image preview, and remove control for screenshots", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 800,
    });

    uploadState.files = [
      {
        id: "thumb-1",
        file: new File(["x"], "image.png", { type: "image/png" }),
        base64: "data:image/png;base64,AAA",
        progress: 100,
        uploadedFile: {
          _id: "uf1",
          name: "image.png",
          url: "https://example.com/image.png",
          size: 1,
        },
      },
    ];

    renderWithProviders(<Feedback data={{}} />, {
      auth: true,
    });

    await screen.findByRole("heading", { name: /send feedback/i });

    expect(screen.getByRole("img", { name: "image.png" })).toBeInTheDocument();

    const remove = screen.getByRole("button", { name: /remove image\.png/i });
    await user.click(remove);
    expect(uploadState.handleDeleteFile).toHaveBeenCalledTimes(1);
    expect(uploadState.handleDeleteFile).toHaveBeenCalledWith(
      expect.objectContaining({ id: "thumb-1" }),
    );
  });
});


it("blocks dismissal and duplicate sends while pending, and retains text after rejection", async () => {
  let finish!: (value: { success: boolean; message: string }) => void;
  submitFeedback.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const user = userEvent.setup();
  renderWithProviders(<FeedbackHost />, { auth: true });
  await user.click(screen.getByRole("button", { name: "Open feedback" }));
  const message = screen.getByRole("textbox", { name: /^message$/i });
  await user.type(message, "Please keep this message");
  const send = screen.getByRole("button", { name: /^send feedback$/i });
  const callsBefore = submitFeedback.mock.calls.length;
  await user.click(send);
  await user.click(send);
  expect(submitFeedback.mock.calls.length).toBe(callsBefore + 1);
  await user.keyboard("{Escape}");
  expect(message).toBeVisible();
  await act(async () => finish({ success: false, message: "Please retry" }));
  expect(message).toHaveValue("Please keep this message");
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

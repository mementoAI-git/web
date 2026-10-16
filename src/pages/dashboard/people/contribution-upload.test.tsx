import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import { ContributionDialog } from "./contribution-dialog";
const upload = vi.hoisted(() => ({
  retryUpload: vi.fn(),
  setFiles: vi.fn(),
  handleUpload: vi.fn(),
  handleDeleteFile: vi.fn(),
  files: [
    {
      id: "failed-file",
      file: { name: "photo.png" },
      progress: 0,
      uploadFailed: true,
    },
  ],
}));
vi.mock("@/hooks/use-file-upload", () => ({ default: () => upload }));
it("retains failed attachments, blocks submission, and retries the complete file payload", async () => {
  renderWithProviders(
    <ContributionDialog
      person={{
        user_id: "tunde",
        name: "Tunde",
        avatar_url: null,
        relationship: "Friend",
        memento_state: "private",
      }}
      onClose={vi.fn()}
      onSaved={vi.fn()}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Upload media" }));
  await userEvent.type(screen.getByLabelText("Title"), "Our trip");
  expect(screen.getByText("photo.png")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Add to Our Space" }),
  ).toBeDisabled();
  await userEvent.click(screen.getByRole("button", { name: "Retry upload" }));
  expect(upload.retryUpload).toHaveBeenCalledWith(upload.files[0]);
  await userEvent.click(screen.getByRole("button", { name: "Remove" }));
  expect(upload.setFiles).toHaveBeenCalled();
  expect(upload.handleDeleteFile).not.toHaveBeenCalled();
});

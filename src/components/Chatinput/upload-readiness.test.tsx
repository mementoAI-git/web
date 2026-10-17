import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import Chatinput from "./index";
const upload = vi.hoisted(() => ({ files: [] as unknown[], handleUpload: vi.fn(), setFiles: vi.fn(), handleDeleteFile: vi.fn() }));
vi.mock("@/hooks/use-file-upload", () => ({ default: () => upload }));
vi.mock("./ImagePreveiw", () => ({ default: () => null }));
it("blocks both Send and keyboard submission until every attachment has a confirmed ID", () => {
  upload.files = [{ id: "ready", progress: 100, uploadedFile: { _id: "file-1" } }, { id: "pending", progress: 100 }];
  const send = vi.fn();
  renderWithProviders(<Chatinput onSend={send} />);
  const input = screen.getByPlaceholderText("Type text here...");
  fireEvent.change(input, { target: { value: "Keep these files" } });
  expect(screen.getByRole("button", { name: "Send", exact: true })).toBeDisabled();
  fireEvent.keyDown(input, { key: "Enter", ctrlKey: true });
  expect(send).not.toHaveBeenCalled();
  expect(input).toHaveValue("Keep these files");
  expect(upload.setFiles).not.toHaveBeenCalled();
});

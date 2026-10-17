import { act, renderHook } from "@testing-library/react";
import type { ChangeEvent } from "react";
import { useProfileAvatarUpload } from "./use-profile-avatar-upload";
const mocks = vi.hoisted(() => ({ trigger: vi.fn(), mutate: vi.fn(), toBase64: vi.fn() }));
vi.mock("swr/mutation", () => ({ default: () => ({ trigger: mocks.trigger }) }));
vi.mock("swr", () => ({ mutate: mocks.mutate }));
vi.mock("@/hooks/use-store", () => ({ useStore: () => ({ user: null }) }));
vi.mock("@/utility/profile-avatar", () => ({ getProfileAvatarUrl: () => "/old-avatar.png" }));
vi.mock("@/utility", () => ({ toBase64: mocks.toBase64 }));
function selection(type = "image/png") {
  return { target: { files: [new File(["image"], "photo.png", { type })], value: "photo.png" } } as unknown as ChangeEvent<HTMLInputElement>;
}
beforeEach(() => { vi.clearAllMocks(); mocks.toBase64.mockResolvedValue("data:image/png;base64,new"); mocks.mutate.mockResolvedValue(undefined); });
it("restores the saved avatar after a rejected upload and allows choosing the same file again", async () => {
  mocks.trigger.mockResolvedValue({ success: false });
  const { result } = renderHook(useProfileAvatarUpload);
  const event = selection();
  await act(() => result.current.handleUpload(event));
  expect(result.current.previewImage).toBe("/old-avatar.png");
  expect(event.target.value).toBe("");
  expect(result.current.isMutating).toBe(false);
  expect(mocks.mutate).not.toHaveBeenCalled();
});
it("guards concurrent uploads during preview preparation and catches read failure", async () => {
  let reject!: (error: Error) => void;
  mocks.toBase64.mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; }));
  const { result } = renderHook(useProfileAvatarUpload);
  let pending!: Promise<void>;
  act(() => { pending = result.current.handleUpload(selection()); });
  expect(result.current.isMutating).toBe(true);
  await act(() => result.current.handleUpload(selection()));
  expect(mocks.toBase64).toHaveBeenCalledTimes(1);
  await act(async () => { reject(new Error("decode failed")); await pending; });
  expect(result.current.previewImage).toBe("/old-avatar.png");
  expect(result.current.isMutating).toBe(false);
});
it("rejects non-images and keeps a confirmed upload after background refresh fails", async () => {
  const { result } = renderHook(useProfileAvatarUpload);
  await act(() => result.current.handleUpload(selection("text/plain")));
  expect(mocks.trigger).not.toHaveBeenCalled();
  mocks.trigger.mockResolvedValue({ success: true });
  mocks.mutate.mockRejectedValue(new Error("offline"));
  await act(() => result.current.handleUpload(selection()));
  expect(result.current.previewImage).toBe("data:image/png;base64,new");
  expect(result.current.isMutating).toBe(false);
});

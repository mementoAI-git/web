import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import { AddGroup } from "./add-group";
import { UpdateGroup } from "./update-group";
import { DeleteGroup } from "./delete-group";
import { ResendInvite } from "../beneficiary/resend-invite";
import { DeleteBeneficiary } from "../beneficiary/delete-beneficiary";
import { UpdateBeneficiary } from "../beneficiary/update-beneficiary";
const mocks = vi.hoisted(() => ({ trigger: vi.fn(), close: vi.fn(), mutate: vi.fn() }));
vi.mock("@/hooks/use-fetcher", () => ({ default: () => ({ trigger: mocks.trigger }) }));
vi.mock("@/hooks/use-modal", async (original) => ({ ...await original<typeof import("@/hooks/use-modal")>(), useModal: () => ({ close: mocks.close }) }));
vi.mock("swr", async (original) => ({ ...await original<typeof import("swr")>(), mutate: mocks.mutate }));
beforeEach(() => { vi.clearAllMocks(); mocks.trigger.mockResolvedValue({ success: true, data: null }); mocks.mutate.mockRejectedValue(new Error("refresh offline")); });
it.each([
  ["delete-group", <DeleteGroup data="family" />, "Delete group"],
  ["resend-invite", <ResendInvite data={{ email: "ada@example.com" }} />, "Resend invite"],
  ["delete-beneficiary", <DeleteBeneficiary data="ada" />, "Remove"],
] as const)("closes %s after confirmed success even when refresh fails", async (name, component, action) => {
  renderWithProviders(component);
  fireEvent.click(screen.getByRole("button", { name: action }));
  await waitFor(() => expect(mocks.close).toHaveBeenCalledWith(name));
  expect(mocks.trigger).toHaveBeenCalledTimes(1);
});
it.each([
  ["add-group", <AddGroup />, "Create group"],
  ["update-group", <UpdateGroup data={{ _id: "family", name: "Family", color: 0 } as never} />, "Save changes"],
] as const)("keeps %s draft on failed save and closes on successful retry", async (name, component, action) => {
  mocks.trigger.mockResolvedValueOnce({ success: false });
  renderWithProviders(component);
  fireEvent.change(screen.getByPlaceholderText("e.g. Family"), { target: { value: "Friends" } });
  await waitFor(() => expect(screen.getByRole("button", { name: action })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: action }));
  await waitFor(() => expect(mocks.trigger).toHaveBeenCalledTimes(1));
  expect(mocks.close).not.toHaveBeenCalled();
  expect(screen.getByPlaceholderText("e.g. Family")).toHaveValue("Friends");
  await waitFor(() => expect(screen.getByRole("button", { name: action })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: action }));
  await waitFor(() => expect(mocks.close).toHaveBeenCalledWith(name));
});
it("saves beneficiary edits without treating refresh failure as a failed write", async () => {
  renderWithProviders(<UpdateBeneficiary data={{ _id: "ada", email: "ada@example.com", name: "Ada", level: 1 }} />);
  fireEvent.change(screen.getByPlaceholderText("John Doe"), { target: { value: "Ada Smith" } });
  await waitFor(() => expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(mocks.close).toHaveBeenCalledWith("update-beneficiary"));
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import { useModal } from "@/hooks/use-modal";
import { InviteFriends } from "./index";
import { get } from "@/api/mutations";
vi.mock("@/hooks/use-store", () => ({
  useStore: () => ({ user: { _id: "inviter-test" } }),
  StoreProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/api/mutations", () => ({ get: vi.fn() }));
const details = {
  invite_url: `https://mymemento.io/register?ref=${"a".repeat(32)}`,
  signup_count: 7,
};
function Host() {
  const { state, open } = useModal();
  return (
    <>
      <button onClick={() => open("invite-friends")}>Invite friends</button>
      {state.length > 0 && <InviteFriends />}
    </>
  );
}
describe("Invite friends", () => {
  beforeEach(() => {
    vi.mocked(get).mockReset();
  });
  it("shows actual signup count and copies the personal link", async () => {
    const user = userEvent.setup();
    vi.mocked(get).mockResolvedValue({ success: true, data: details });
    renderWithProviders(<InviteFriends />, { auth: true });
    expect(await screen.findByLabelText("7 friends joined")).toHaveTextContent(
      "7",
    );
    expect(screen.getByText("Bring your people along.")).toBeInTheDocument();
    expect(
      screen
        .getByLabelText("Your invite link")
        .compareDocumentPosition(screen.getByLabelText("7 friends joined")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      screen
        .getByText("Signups through your link")
        .closest('[data-slot="card"]'),
    ).toHaveClass("bg-fill-lime-weak");
    expect(screen.queryByText("Friends who joined")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Thanks for bringing your friends along."),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Your invite link")).toHaveValue(
      details.invite_url,
    );
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(
      await screen.findByRole("button", { name: "Copied" }),
    ).toBeInTheDocument();
    expect(await navigator.clipboard.readText()).toBe(details.invite_url);
  });
  it("shows an error without a fabricated count and retries", async () => {
    const user = userEvent.setup();
    vi.mocked(get)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue({
        success: true,
        data: { ...details, signup_count: 0 },
      });
    renderWithProviders(<InviteFriends />, { auth: true });
    expect(await screen.findByRole("alert")).toHaveTextContent("couldn’t load");
    expect(screen.queryByLabelText(/friends joined/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() =>
      expect(screen.getByLabelText("0 friends joined")).toHaveTextContent("0"),
    );
    expect(
      screen.queryByText("Your first invite starts here."),
    ).not.toBeInTheDocument();
  });
  it("closes with Escape and restores focus to the sidebar action", async () => {
    const user = userEvent.setup();
    vi.mocked(get).mockResolvedValue({ success: true, data: details });
    renderWithProviders(<Host />, { auth: true });
    const trigger = screen.getByRole("button", { name: "Invite friends" });
    await user.click(trigger);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
  });
  it("selects the link for manual copying if clipboard access fails", async () => {
    const user = userEvent.setup();
    vi.mocked(get).mockResolvedValue({ success: true, data: details });
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(
      new Error("denied"),
    );
    renderWithProviders(<InviteFriends />, { auth: true });
    await screen.findByLabelText("7 friends joined");
    await user.click(screen.getByRole("button", { name: "Copy" }));
    const input = screen.getByLabelText("Your invite link") as HTMLInputElement;
    expect(input).toHaveFocus();
    expect(input.selectionEnd).toBe(details.invite_url.length);
    expect(
      screen.queryByRole("button", { name: "Copied" }),
    ).not.toBeInTheDocument();
  });
});

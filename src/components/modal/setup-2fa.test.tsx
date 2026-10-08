import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import Setup2FA from "./setup-2fa";

const mocks = vi.hoisted(() => ({ close: vi.fn(), trigger: vi.fn() }));
vi.mock("@/hooks/use-fetcher", () => ({
  default: () => ({ trigger: mocks.trigger, isMutating: false }),
}));
vi.mock("@/hooks/use-modal", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/use-modal")>()),
  useModal: () => ({ close: mocks.close }),
}));

const data = {
  qrcode: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>",
  secret: "DEMOSETUPKEY",
};
async function setup() {
  await act(async () => {
    renderWithProviders(<Setup2FA data={data} />);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.trigger.mockResolvedValue({ status: true, message: "Enabled" });
});

describe("2FA setup dialog", () => {
  it("renders one accessible dialog and one labeled verification field", async () => {
    await setup();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(
      screen.getByRole("dialog", { name: "Set up two-factor authentication" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Protect your account with an authenticator app."),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "3. Enter your verification code" }),
    ).toHaveAttribute("inputmode", "numeric");
    expect(
      screen.getByRole("img", { name: "Authenticator setup QR code" }),
    ).toBeInTheDocument();
  });
  it("toggles the manual setup key, copies it, and restores the QR view", async () => {
    const user = userEvent.setup();
    await setup();
    await user.click(
      screen.getByRole("button", { name: "Can’t scan? Enter a setup key" }),
    );
    expect(screen.getByRole("textbox", { name: "Setup key" })).toHaveValue(
      data.secret,
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Copy setup key" }));
    expect(await navigator.clipboard.readText()).toBe(data.secret);
    await user.click(screen.getByRole("button", { name: "Show QR code" }));
    expect(screen.getByRole("img")).toBeInTheDocument();
  });
  it("pastes the code and submits the existing verification payload", async () => {
    const user = userEvent.setup();
    await setup();
    await navigator.clipboard.writeText(" 123456 ");
    await user.click(screen.getByRole("button", { name: "Paste code" }));
    expect(screen.getByRole("textbox")).toHaveValue("123456");
    await user.click(screen.getByRole("button", { name: "Complete setup" }));
    await waitFor(() =>
      expect(mocks.trigger).toHaveBeenCalledWith({ token: "123456" }),
    );
    expect(mocks.close).toHaveBeenCalledWith("setup2fa");
  });
  it("shows an associated error and avoids submitting an incomplete code", async () => {
    const user = userEvent.setup();
    await setup();
    await user.type(screen.getByRole("textbox"), "123");
    await user.click(screen.getByRole("button", { name: "Complete setup" }));
    expect(await screen.findByText("Enter a 6-digit code")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
    expect(mocks.trigger).not.toHaveBeenCalled();
  });
  it("dismisses through Escape, the close control, and Cancel", async () => {
    const user = userEvent.setup();
    await setup();
    await user.keyboard("{Escape}");
    expect(mocks.close).toHaveBeenCalledWith("setup2fa");
    mocks.close.mockClear();
    await user.click(
      screen.getByRole("button", { name: "Close", exact: true }),
    );
    expect(mocks.close).toHaveBeenCalledWith("setup2fa");
    mocks.close.mockClear();
    await user.click(
      screen.getByRole("button", { name: "Cancel", exact: true }),
    );
    expect(mocks.close).toHaveBeenCalledWith("setup2fa");
  });
});

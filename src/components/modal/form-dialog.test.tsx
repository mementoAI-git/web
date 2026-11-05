import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormDialog, FormDialogField, FormDialogFooter, FormDialogInput } from "./form-dialog";

function Example({ busy = false, onClose = vi.fn() }: { busy?: boolean; onClose?: () => void }) {
  return (
    <FormDialog title="Invite person" description="Invite someone." busy={busy} onClose={onClose}>
      <form>
        <FormDialogField label="Name" htmlFor="name" error="Name is required">
          <FormDialogInput id="name" />
        </FormDialogField>
        <FormDialogFooter submitLabel="Send invite" busyLabel="Sending…" busy={busy} onDismiss={onClose} />
      </form>
    </FormDialog>
  );
}

describe("FormDialog", () => {
  it("names the dialog, labels fields, and focuses the first field", () => {
    render(<Example />);
    expect(screen.getByRole("dialog", { name: "Invite person" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveFocus();
    expect(screen.getByText("Name is required")).toBeInTheDocument();
  });

  it("closes from the close button, Dismiss, and Escape", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Example onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("cannot be dismissed while busy", async () => {
    const onClose = vi.fn();
    render(<Example busy onClose={onClose} />);
    await userEvent.setup().keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Close" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Sending/ })).toBeDisabled();
  });
});

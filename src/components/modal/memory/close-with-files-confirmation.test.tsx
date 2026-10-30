import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CloseWithFilesConfirmation } from "./close-with-files-confirmation";

describe("discard confirmation", () => {
  it("prevents repeated actions while attachment cleanup is running", () => {
    const confirm = vi.fn();
    const close = vi.fn();
    render(<CloseWithFilesConfirmation open busy onConfirm={confirm} close={close} />);
    expect(screen.getByRole("button", { name: "Discarding…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Keep editing" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Discarding…" }));
    expect(confirm).not.toHaveBeenCalled();
  });
  it("allows keeping the story when cleanup has not started", () => {
    const close = vi.fn();
    render(<CloseWithFilesConfirmation open onConfirm={vi.fn()} close={close} />);
    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(close).toHaveBeenCalledOnce();
  });
});

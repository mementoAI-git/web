import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ModalLayout, { FullScreenModal, ModalCloseBtn, ModalWrapper } from "./modalLayout";

describe("overlay close controls", () => {
  it.each(["layout", "mobile", "fullscreen", "standalone"])("labels the %s close control and supports keyboard activation", async (kind) => {
    const close = vi.fn();
    const control = kind === "layout" ? <ModalLayout open onClose={close}>Content</ModalLayout>
      : kind === "mobile" ? <ModalWrapper isMobile header="Title" onClose={close}>Content</ModalWrapper>
        : kind === "fullscreen" ? <FullScreenModal open header="Title" onClose={close}>Content</FullScreenModal>
          : <ModalCloseBtn onClick={close} />;
    render(control);
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(close).toHaveBeenCalledTimes(1);
  });
});

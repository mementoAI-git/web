import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Dialog, DialogContent, DialogTitle } from "./dialog";
import { SheetGrabber } from "./sheet-grabber";

beforeAll(() => {
  HTMLElement.prototype.setPointerCapture = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function drag(element: Element, distance: number, duration = 10_000) {
  const now = vi.spyOn(performance, "now").mockReturnValue(0);
  fireEvent.pointerDown(element, { clientY: 100, pointerId: 1 });
  fireEvent.pointerMove(element, { clientY: 100 + distance, pointerId: 1 });
  now.mockReturnValue(duration);
  fireEvent.pointerUp(element, { clientY: 100 + distance, pointerId: 1 });
  now.mockRestore();
}

function renderGrabber() {
  const onDismiss = vi.fn();
  const { container } = render(
    <div>
      <SheetGrabber onDismiss={onDismiss} />
    </div>,
  );
  return { onDismiss, grabber: container.querySelector(".sheet-grabber")! };
}

describe("SheetGrabber", () => {
  it("dismisses after a long drag down", () => {
    const { grabber, onDismiss } = renderGrabber();
    drag(grabber, 200);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("stays open after a short, slow drag", () => {
    const { grabber, onDismiss } = renderGrabber();
    drag(grabber, 30);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("dismisses after a quick flick down", () => {
    const { grabber, onDismiss } = renderGrabber();
    drag(grabber, 40, 50);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("stays open when the drag goes up", () => {
    const { grabber, onDismiss } = renderGrabber();
    drag(grabber, -200);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("does not dismiss when the browser cancels the drag", () => {
    const { grabber, onDismiss } = renderGrabber();
    fireEvent.pointerDown(grabber, { clientY: 100, pointerId: 1 });
    fireEvent.pointerCancel(grabber, { clientY: 400, pointerId: 1 });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("closes a dialog through its normal dismissal path", () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent showCloseButton={false} aria-describedby={undefined}>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    // The hidden dismiss control must not show up as an extra button.
    expect(screen.queryByRole("button")).toBeNull();
    drag(document.querySelector(".sheet-grabber")!, 200);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ModalProvider, useModal } from "@/hooks/use-modal";
import { ChatSettingsDrawer } from "./chat-settings-drawer";

function DrawerWithFiles() {
  const [open, setOpen] = useState(false);
  const { state, push, close } = useModal();
  return <>
    <button onClick={() => setOpen(true)}>Chat settings</button>
    <ChatSettingsDrawer isOpen={open} onClose={() => setOpen(false)}>
      {() => <button onClick={() => push?.("conversation-files")}>Images</button>}
    </ChatSettingsDrawer>
    {state[0]?.name === "conversation-files" && <section role="dialog" aria-label="All files">
      <input aria-label="Search files" />
      <button onClick={() => close?.("conversation-files")}>Close files</button>
    </section>}
  </>;
}

describe("chat settings modal handoff", () => {
  it("releases pointer and focus restrictions for files, then restores the drawer", async () => {
    const user = userEvent.setup();
    render(<ModalProvider><DrawerWithFiles /></ModalProvider>);
    const trigger = screen.getByRole("button", { name: "Chat settings" });
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Images" }));

    const files = await screen.findByRole("dialog", { name: "All files" });
    expect(files.closest('[aria-hidden="true"]')).toBeNull();
    expect(document.body.style.pointerEvents).not.toBe("none");
    expect(screen.queryByRole("dialog", { name: "Chat settings" })).not.toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: "Search files" }), "family");
    expect(screen.getByRole("textbox")).toHaveValue("family");
    await user.click(screen.getByRole("button", { name: "Close files" }));
    await screen.findByRole("dialog", { name: "Chat settings" });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(document.body.style.pointerEvents).not.toBe("none");
  });
});

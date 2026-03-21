import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  ConversationChromeProvider,
  useConversationChrome,
} from "./conversation-chrome";

function Probe() {
  const { chrome, setChrome } = useConversationChrome();
  return (
    <button
      type="button"
      onClick={() => setChrome({ memory: null })}
    >
      {chrome ? "set" : "empty"}
    </button>
  );
}

describe("ConversationChromeProvider", () => {
  it("provides chrome state to descendants", async () => {
    const user = userEvent.setup();
    render(
      <ConversationChromeProvider>
        <Probe />
      </ConversationChromeProvider>,
    );

    const btn = screen.getByRole("button");
    expect(btn).toHaveTextContent("empty");
    await user.click(btn);
    expect(btn).toHaveTextContent("set");
  });
});

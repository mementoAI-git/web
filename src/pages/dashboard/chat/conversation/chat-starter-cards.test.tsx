import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatStarterCards } from "./chat-starter-cards";

describe("shared Chat starter cards", () => {
  it("sends the selected contextual prompt through the existing callback", async () => {
    const onPrompt = vi.fn();
    render(
      <ChatStarterCards
        prompts={[
          {
            label: "Growing up",
            prompt: "What was it like growing up as Sarah?",
          },
          { label: "Values", prompt: "What does Sarah care about?" },
        ]}
        onPrompt={onPrompt}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Growing up" }));
    expect(onPrompt).toHaveBeenCalledWith(
      "What was it like growing up as Sarah?",
    );
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });
  it("pads each card by 12px vertically and 16px horizontally", () => {
    render(
      <ChatStarterCards
        prompts={[{ label: "Values", prompt: "Values" }]}
        onPrompt={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Values" })).toHaveClass("px-4", "py-3");
  });
  it("prevents starter submission while the conversation is busy", async () => {
    const onPrompt = vi.fn();
    render(
      <ChatStarterCards
        prompts={[{ label: "Values", prompt: "Values" }]}
        onPrompt={onPrompt}
        disabled
      />,
    );
    const button = screen.getByRole("button", { name: "Values" });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onPrompt).not.toHaveBeenCalled();
  });
});

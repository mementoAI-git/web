import { render, screen } from "@testing-library/react";
import ConversationHeader from "./header";
import { type IMemory } from "@/utility/interface";

const baseMemory: IMemory = {
  _id: "m1",
  title: "Test chat",
  bookmarked: false,
} as IMemory;

describe("ConversationHeader", () => {
  it("renders the bordered card at full width of its container", () => {
    render(
      <ConversationHeader memory={baseMemory} onViewDetails={() => {}} />,
    );

    const card = screen.getByText("Test chat").closest(".border");
    expect(card).toBeInTheDocument();
    expect(card?.className).toMatch(/\bw-full\b/);
    expect(card?.className).not.toMatch(/max-w-\[600px\]/);
    expect(card?.className).not.toMatch(/\bmx-auto\b/);
  });

  it("does not render the Question tag pill", () => {
    render(
      <ConversationHeader memory={baseMemory} onViewDetails={() => {}} />,
    );
    expect(screen.queryByRole("button", { name: "Question" })).toBeNull();
  });

  it("wraps the header icon in a 40px square container", () => {
    render(
      <ConversationHeader memory={baseMemory} onViewDetails={() => {}} />,
    );
    const card = screen.getByText("Test chat").closest(".border");
    const icon = card?.querySelector(".size-10 img");
    expect(icon).toBeTruthy();
    expect(icon?.parentElement?.className).toMatch(/\bsize-10\b/);
  });

  it("renders Chat settings on the right side of the header", () => {
    render(
      <ConversationHeader memory={baseMemory} onViewDetails={() => {}} />,
    );
    expect(
      screen.getByRole("button", { name: /chat settings/i }),
    ).toBeInTheDocument();
  });
});

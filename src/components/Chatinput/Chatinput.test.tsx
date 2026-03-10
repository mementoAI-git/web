import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import Chatinput from "./index";

describe("Chatinput", () => {
  it("renders textarea with slash-command placeholder", () => {
    renderWithProviders(<Chatinput onSend={() => {}} />, { auth: true });
    expect(
      screen.getByPlaceholderText("Type text here... Type / for formatting"),
    ).toBeInTheDocument();
  });

  it("shows slash command menu when user types /", () => {
    renderWithProviders(<Chatinput onSend={() => {}} />, { auth: true });
    const textarea = screen.getByPlaceholderText(
      "Type text here... Type / for formatting",
    );
    fireEvent.change(textarea, { target: { value: "/", selectionStart: 1 } });
    expect(screen.getByText("Basic blocks")).toBeInTheDocument();
    expect(screen.getByText("Heading 1")).toBeInTheDocument();
    expect(screen.getByText("Bold")).toBeInTheDocument();
  });

  it("hides slash command menu when user deletes the slash", () => {
    renderWithProviders(<Chatinput onSend={() => {}} />, { auth: true });
    const textarea = screen.getByPlaceholderText(
      "Type text here... Type / for formatting",
    );
    fireEvent.change(textarea, { target: { value: "/", selectionStart: 1 } });
    expect(screen.getByText("Basic blocks")).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: "", selectionStart: 0 } });
    fireEvent.select(textarea);
    expect(screen.queryByText("Basic blocks")).not.toBeInTheDocument();
  });

  it("applies format when user selects a command from the menu", () => {
    renderWithProviders(<Chatinput onSend={() => {}} />, { auth: true });
    const textarea = screen.getByPlaceholderText(
      "Type text here... Type / for formatting",
    );
    fireEvent.change(textarea, { target: { value: "/", selectionStart: 1 } });
    const heading1 = screen.getByText("Heading 1");
    fireEvent.click(heading1);

    expect(textarea).toHaveValue("# ");
  });

  it("applies format when user presses Enter with menu open", () => {
    renderWithProviders(<Chatinput onSend={() => {}} />, { auth: true });
    const textarea = screen.getByPlaceholderText(
      "Type text here... Type / for formatting",
    );
    fireEvent.change(textarea, { target: { value: "/", selectionStart: 1 } });
    expect(screen.getByText("Basic blocks")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Enter" });
    expect(textarea).toHaveValue("# ");
  });

  it("navigates menu with arrow keys and applies with Enter", () => {
    renderWithProviders(<Chatinput onSend={() => {}} />, { auth: true });
    const textarea = screen.getByPlaceholderText(
      "Type text here... Type / for formatting",
    );
    fireEvent.change(textarea, { target: { value: "/", selectionStart: 1 } });

    fireEvent.keyDown(document, { key: "ArrowDown" });
    fireEvent.keyDown(document, { key: "Enter" });
    expect(textarea).toHaveValue("## ");
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Searchinput } from "./search-input";

describe("Searchinput", () => {
  it("renders default Search placeholder", () => {
    render(<Searchinput />);
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
  });

  it("forwards placeholder and onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Searchinput placeholder="Find memories" onChange={onChange} />);
    await user.type(screen.getByPlaceholderText("Find memories"), "x");
    expect(onChange).toHaveBeenCalled();
  });

  it("renders end slot", () => {
    render(<Searchinput end={<kbd data-testid="kbd">⌘K</kbd>} />);
    expect(screen.getByTestId("kbd")).toBeInTheDocument();
  });
});

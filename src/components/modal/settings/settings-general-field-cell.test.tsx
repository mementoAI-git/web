import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SettingsGeneralFieldCell } from "./settings-general-field-cell";

describe("SettingsGeneralFieldCell", () => {
  it("shows placeholder when display value is empty", () => {
    render(
      <SettingsGeneralFieldCell label="Title" placeholder="Add a title" displayValue="" />,
    );
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Add a title")).toBeInTheDocument();
  });

  it("shows display value when set", () => {
    render(<SettingsGeneralFieldCell label="Name" placeholder="Add name" displayValue="Ada" />);
    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(screen.queryByText("Add name")).not.toBeInTheDocument();
  });

  it("uses weak text color for the label", () => {
    render(<SettingsGeneralFieldCell label="Email" placeholder="None" displayValue="a@b.co" />);
    expect(screen.getByText("Email")).toHaveClass("text-v3-text-weak");
  });

  it("renders value adornment", () => {
    render(
      <SettingsGeneralFieldCell
        label="Email"
        placeholder="None"
        displayValue="a@b.co"
        valueAdornment={<button type="button">Copy</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });
});

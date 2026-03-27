import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@testing-library/react";
import { SettingsGeneralFieldRow } from "./settings-general-field-row";

describe("SettingsGeneralFieldRow", () => {
  it("shows placeholder when display value is empty and toggles editor", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <SettingsGeneralFieldRow
        icon={<span data-testid="icon">i</span>}
        label="Title"
        placeholder="Add a title"
        displayValue=""
        isEditing={false}
        onToggleEdit={onToggle}
      >
        <div>Editor</div>
      </SettingsGeneralFieldRow>,
    );

    expect(screen.getByText("Add a title")).toBeInTheDocument();
    expect(screen.queryByText("Editor")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /edit title/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("renders display value and expanded children when editing", async () => {
    render(
      <SettingsGeneralFieldRow
        icon={<span data-testid="icon">i</span>}
        label="Email"
        placeholder="Add email"
        displayValue="a@b.co"
        isEditing
        onToggleEdit={() => {}}
      >
        <input type="text" aria-label="Email field" />
      </SettingsGeneralFieldRow>,
    );

    expect(screen.getByText("a@b.co")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /email field/i })).toBeInTheDocument();
  });
});

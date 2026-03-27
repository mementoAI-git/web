import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@testing-library/react";
import { SettingsActionRow, SettingsPillButton } from "./settings-action-row";

describe("SettingsActionRow", () => {
  it("renders label and action with space-between layout", () => {
    render(
      <SettingsActionRow
        label="Log out of all devices"
        action={
          <SettingsPillButton type="button" variant="default">
            Log out
          </SettingsPillButton>
        }
      />,
    );

    expect(screen.getByText("Log out of all devices")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument();
  });

  it("invokes pill button callback", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <SettingsActionRow
        label="Delete"
        action={
          <SettingsPillButton variant="destructive" onClick={onClick}>
            Remove
          </SettingsPillButton>
        }
      />,
    );

    await user.click(screen.getByRole("button", { name: /remove/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DeepDiveNudge } from "./deep-dive-nudge";

describe("DeepDiveNudge", () => {
  it("calls onDeepDive and onDismiss", async () => {
    const user = userEvent.setup();
    const onDeepDive = vi.fn();
    const onDismiss = vi.fn();

    render(
      <DeepDiveNudge
        dimension="relationships_people"
        onDeepDive={onDeepDive}
        onDismiss={onDismiss}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^start$/i }));
    expect(onDeepDive).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: /^later$/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

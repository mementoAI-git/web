import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IdentityStep4 } from "./IdentityStep4";

describe("IdentityStep4", () => {
  it("renders life context cards", () => {
    render(
      <IdentityStep4
        lifeContext={[]}
        onLifeContextChange={() => {}}
      />
    );
    expect(screen.getByText(/your life right now/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /still working/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /none of these feel right/i })
    ).toBeInTheDocument();
  });

  it("calls onLifeContextChange when card clicked", async () => {
    const user = userEvent.setup();
    const onLifeContextChange = vi.fn();
    render(
      <IdentityStep4
        lifeContext={[]}
        onLifeContextChange={onLifeContextChange}
      />
    );
    await user.click(screen.getByRole("button", { name: /still working/i }));
    expect(onLifeContextChange).toHaveBeenCalledWith(["still_working"]);
  });

  it("none of these clears others when selected", async () => {
    const user = userEvent.setup();
    const onLifeContextChange = vi.fn();
    render(
      <IdentityStep4
        lifeContext={["still_working"]}
        onLifeContextChange={onLifeContextChange}
      />
    );
    await user.click(screen.getByRole("button", { name: /none of these feel right/i }));
    expect(onLifeContextChange).toHaveBeenCalledWith(["none_of_these"]);
  });

  it("selecting other option clears none_of_these", async () => {
    const user = userEvent.setup();
    const onLifeContextChange = vi.fn();
    render(
      <IdentityStep4
        lifeContext={["none_of_these"]}
        onLifeContextChange={onLifeContextChange}
      />
    );
    await user.click(screen.getByRole("button", { name: /still working/i }));
    expect(onLifeContextChange).toHaveBeenCalledWith(["still_working"]);
  });

  it("shows validation error when provided", () => {
    render(
      <IdentityStep4
        lifeContext={[]}
        onLifeContextChange={() => {}}
        validationErrors={{
          lifeContext: "Please pick at least one.",
        }}
      />
    );
    expect(screen.getByText(/please pick at least one/i)).toBeInTheDocument();
  });
});

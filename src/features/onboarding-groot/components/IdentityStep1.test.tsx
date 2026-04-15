import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IdentityStep1 } from "./IdentityStep1";

describe("IdentityStep1", () => {
  it("renders full name and nickname inputs", () => {
    render(
      <IdentityStep1
        fullName=""
        onFullNameChange={() => {}}
        displayName=""
        onDisplayNameChange={() => {}}
      />
    );
    expect(screen.getByLabelText(/what's your full name/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/what do people closest to you call you/i)
    ).toBeInTheDocument();
  });

  it("calls onFullNameChange when full name changes", async () => {
    const user = userEvent.setup();
    const onFullNameChange = vi.fn();
    render(
      <IdentityStep1
        fullName=""
        onFullNameChange={onFullNameChange}
        displayName=""
        onDisplayNameChange={() => {}}
      />
    );
    await user.type(
      screen.getByLabelText(/what's your full name/i),
      "Jane Doe"
    );
    expect(onFullNameChange).toHaveBeenCalled();
  });

  it("calls onDisplayNameChange when nickname changes", async () => {
    const user = userEvent.setup();
    const onDisplayNameChange = vi.fn();
    render(
      <IdentityStep1
        fullName=""
        onFullNameChange={() => {}}
        displayName=""
        onDisplayNameChange={onDisplayNameChange}
      />
    );
    await user.type(
      screen.getByLabelText(/what do people closest to you call you/i),
      "Jane"
    );
    expect(onDisplayNameChange).toHaveBeenCalled();
  });

  it("shows validation errors when provided", () => {
    render(
      <IdentityStep1
        fullName=""
        onFullNameChange={() => {}}
        displayName=""
        onDisplayNameChange={() => {}}
        validationErrors={{
          fullName: "We'd love to know your full name.",
          displayName: "We'd love to know what to call you.",
        }}
      />
    );
    expect(
      screen.getByText(/we'd love to know your full name/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/we'd love to know what to call you/i)
    ).toBeInTheDocument();
  });
});

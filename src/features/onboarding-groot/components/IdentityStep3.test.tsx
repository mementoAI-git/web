import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IdentityStep3 } from "./IdentityStep3";

describe("IdentityStep3", () => {
  it("renders passion cards", () => {
    render(
      <IdentityStep3
        passions={[]}
        onPassionsChange={() => {}}
        passionsFreetext=""
        onPassionsFreetextChange={() => {}}
      />
    );
    expect(screen.getByText(/what you love/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /music/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /food & cooking/i })).toBeInTheDocument();
  });

  it("calls onPassionsChange when passion card clicked", async () => {
    const user = userEvent.setup();
    const onPassionsChange = vi.fn();
    render(
      <IdentityStep3
        passions={[]}
        onPassionsChange={onPassionsChange}
        passionsFreetext=""
        onPassionsFreetextChange={() => {}}
      />
    );
    await user.click(screen.getByRole("button", { name: /music/i }));
    expect(onPassionsChange).toHaveBeenCalledWith(["music"]);
  });

  it("shows something else input when something else selected", () => {
    render(
      <IdentityStep3
        passions={["something_else"]}
        onPassionsChange={() => {}}
        passionsFreetext=""
        onPassionsFreetextChange={() => {}}
      />
    );
    expect(screen.getByLabelText(/tell us more/i)).toBeInTheDocument();
  });

  it("shows validation error when provided", () => {
    render(
      <IdentityStep3
        passions={[]}
        onPassionsChange={() => {}}
        passionsFreetext=""
        onPassionsFreetextChange={() => {}}
        validationErrors={{
          passions: "Pick at least one.",
        }}
      />
    );
    expect(screen.getByText(/pick at least one/i)).toBeInTheDocument();
  });
});

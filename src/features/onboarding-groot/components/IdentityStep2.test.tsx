import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IdentityStep2 } from "./IdentityStep2";

describe("IdentityStep2", () => {
  it("renders age band, where from, and memento for sections", () => {
    render(
      <IdentityStep2
        ageBand={null}
        onAgeBandSelect={() => {}}
        whereFrom=""
        onWhereFromChange={() => {}}
        mementoFor={[]}
        onMementoForChange={() => {}}
      />
    );
    expect(screen.getByText(/how old are you/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/where are you from/i)).toBeInTheDocument();
    expect(screen.getByText(/who is this memento mostly for/i)).toBeInTheDocument();
  });

  it("calls onAgeBandSelect when age card clicked", async () => {
    const user = userEvent.setup();
    const onAgeBandSelect = vi.fn();
    render(
      <IdentityStep2
        ageBand={null}
        onAgeBandSelect={onAgeBandSelect}
        whereFrom=""
        onWhereFromChange={() => {}}
        mementoFor={[]}
        onMementoForChange={() => {}}
      />
    );
    await user.click(screen.getByRole("button", { name: /30s–40s/i }));
    expect(onAgeBandSelect).toHaveBeenCalledWith("30s_40s");
  });

  it("calls onMementoForChange when who-for card clicked", async () => {
    const user = userEvent.setup();
    const onMementoForChange = vi.fn();
    render(
      <IdentityStep2
        ageBand={null}
        onAgeBandSelect={() => {}}
        whereFrom=""
        onWhereFromChange={() => {}}
        mementoFor={[]}
        onMementoForChange={onMementoForChange}
      />
    );
    await user.click(screen.getByRole("button", { name: /my children/i }));
    expect(onMementoForChange).toHaveBeenCalledWith(["children"]);
  });

  it("shows validation errors when provided", () => {
    render(
      <IdentityStep2
        ageBand={null}
        onAgeBandSelect={() => {}}
        whereFrom=""
        onWhereFromChange={() => {}}
        mementoFor={[]}
        onMementoForChange={() => {}}
        validationErrors={{
          ageBand: "Please pick an age range.",
          mementoFor: "Please pick at least one.",
        }}
      />
    );
    expect(screen.getByText(/please pick an age range/i)).toBeInTheDocument();
    expect(screen.getByText(/please pick at least one/i)).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeletedMemoryStatus } from "./deleted-memory-status";
import { recoveryLabel, canRestoreMemory } from "./memory-recovery";
const memory = { deleted_at: "2026-10-15T12:00:00Z", delete_after: "2026-11-14T12:00:00Z" };
const now = new Date("2026-10-15T12:00:00Z").getTime();
afterEach(() => vi.useRealTimers());
describe("Deleted memory recovery details", () => {
  it("shows the deletion date rather than creation date and the recovery deadline", () => {
    vi.useFakeTimers(); vi.setSystemTime(now);
    render(<DeletedMemoryStatus memory={memory} showDeletedAt />);
    expect(screen.getByText("Oct 15, 2026")).toHaveAttribute("dateTime", memory.deleted_at);
    expect(screen.getByText("Permanently deletes in 30 days")).toHaveAttribute("dateTime", memory.delete_after);
  });
  it("handles final hours and the exact expiry boundary without displaying negative time", () => {
    expect(recoveryLabel(memory.delete_after, now + 29.5 * 86400000)).toBe("Permanently deletes in 12 hours");
    expect(recoveryLabel(memory.delete_after, now + 30 * 86400000)).toBe("Pending permanent deletion");
    expect(canRestoreMemory(memory, now + 30 * 86400000)).toBe(false);
  });
  it("does not invent a timestamp for old responses", () => {
    render(<DeletedMemoryStatus memory={{}} showDeletedAt />);
    expect(screen.getByText("Recovery window unavailable")).toBeInTheDocument();
    expect(screen.queryByRole("time")).not.toBeInTheDocument();
  });
});

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import type { IMemory } from "@/utility/interface";
import { MemoryDropdown } from "./dropdown";

const mockPush = vi.fn();

const mockMemory: IMemory = {
  _id: "m1",
  title: "Test",
  body: "",
  user: "u1",
  attachments: [],
  tags: [],
  type: "chat",
  status: "active",
  level: 0,
  refrence: "",
  last_opened: "",
  created_at: "",
  updated_at: "",
};

vi.mock("@/hooks/use-modal", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-modal")>();
  return {
    ...actual,
    useModal: () => ({
      state: [],
      open: vi.fn(),
      push: mockPush,
      close: vi.fn(),
    }),
  };
});

describe("MemoryDropdown", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("uses an info-style trigger (lucide Info) with v3 transparent control", () => {
    renderWithProviders(
      <MemoryDropdown memory={mockMemory} onViewDetails={() => {}} />,
      { route: "/chat/m1", auth: true },
    );

    const trigger = screen.getByRole("button", { name: /open memory sidebar/i });
    expect(trigger.querySelector("svg")).toBeTruthy();
    expect(trigger.className).toMatch(/hover:bg-fill-neutral-weaker/);
  });

  it("calls onViewDetails when provided instead of opening a modal", async () => {
    const user = userEvent.setup();
    const onViewDetails = vi.fn();
    renderWithProviders(
      <MemoryDropdown memory={mockMemory} onViewDetails={onViewDetails} />,
      { route: "/chat/m1", auth: true },
    );

    await user.click(screen.getByRole("button", { name: /open memory sidebar/i }));
    expect(onViewDetails).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("pushes view-memory-details when onViewDetails is omitted", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MemoryDropdown memory={mockMemory} />, {
      route: "/chat/m1",
      auth: true,
    });

    await user.click(screen.getByRole("button", { name: /open memory sidebar/i }));
    expect(mockPush).toHaveBeenCalledWith("view-memory-details", {
      memory: mockMemory,
    });
  });
});

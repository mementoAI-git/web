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

  it("uses an info-style trigger (lucide Info) with a transparent-style control", () => {
    renderWithProviders(
      <MemoryDropdown memory={mockMemory} />,
      { route: "/chat/m1", auth: true },
    );

    const trigger = screen.getByRole("button");
    expect(trigger.querySelector("svg")).toBeTruthy();
    expect(trigger.className).toMatch(/bg-transparent/);
    expect(trigger.className).toMatch(/hover:bg-v3-fill-weak/);
  });

  it("opens edit-memory modal when Edit memory is chosen", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <MemoryDropdown memory={mockMemory} />,
      { route: "/chat/m1", auth: true },
    );

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("Edit memory"));
    expect(mockPush).toHaveBeenCalledWith("edit-memory", { memory: mockMemory });
  });

  it("calls onExportConversation when Export conversation is chosen", async () => {
    const user = userEvent.setup();
    const onExportConversation = vi.fn();
    renderWithProviders(
      <MemoryDropdown
        memory={mockMemory}
        onExportConversation={onExportConversation}
      />,
      { route: "/chat/m1", auth: true },
    );

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("Export conversation"));
    expect(onExportConversation).toHaveBeenCalledTimes(1);
  });
});

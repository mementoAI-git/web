import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import type { IMemory } from "@/utility/interface";
import { MemoryDropdown } from "./dropdown";

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
      push: vi.fn(),
      close: vi.fn(),
    }),
  };
});

describe("MemoryDropdown", () => {
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
});

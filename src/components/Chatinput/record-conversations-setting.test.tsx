import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { readRecordConversations, recordConversationsKey } from "@/features/voice/recording/preference";
import { RecordConversationsSetting } from "./record-conversations-setting";

const store = vi.hoisted(() => ({ user: { _id: "u1" } as { _id: string } | null }));
vi.mock("@/hooks/use-store", () => ({ useStore: () => store }));

beforeEach(() => {
  window.localStorage.clear();
  store.user = { _id: "u1" };
});

it("is on by default and remembers turning it off for this account", () => {
  render(<RecordConversationsSetting />);
  const toggle = screen.getByRole("switch", { name: "Record conversations" });
  expect(toggle).toBeChecked();
  expect(toggle).toHaveAccessibleDescription("Save each conversation to Stories with its audio.");

  fireEvent.click(toggle);
  expect(toggle).not.toBeChecked();
  expect(window.localStorage.getItem(recordConversationsKey("u1"))).toBe("false");
  expect(readRecordConversations("u1")).toBe(false);
  expect(readRecordConversations("someone-else")).toBe(true);
});

it("can't be changed before the account is known", () => {
  store.user = null;
  render(<RecordConversationsSetting />);
  expect(screen.getByRole("switch", { name: "Record conversations" })).toBeDisabled();
});

it("treats anything but an explicit false as on", () => {
  window.localStorage.setItem(recordConversationsKey("u1"), "garbage");
  expect(readRecordConversations("u1")).toBe(true);
  expect(readRecordConversations(null)).toBe(true);
});

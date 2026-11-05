import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { vi } from "vitest";
import { renderWithProviders, server } from "@/test";
import { ConnectionCard, PendingConnectionCard } from "./person-card";
import type { Person } from "@/api/people";

const person: Person = {
  user_id: "person-1",
  name: "Sam Smith",
  relationship: "Friend",
  avatar_url: null,
  memento_state: "private",
};

it("shows a real memory count and opens settings without selecting the card", async () => {
  server.use(
    http.get("http://localhost:3000/api/people/person-1/settings", () =>
      HttpResponse.json({
        success: true,
        data: { relationship: "Friend", shared_item_count: 14 },
      }),
    ),
  );
  const onOpen = vi.fn();
  const onSettings = vi.fn();
  const user = userEvent.setup();
  renderWithProviders(
    <ConnectionCard
      person={{ ...person, unread_count: 2 }}
      selected={false}
      onOpen={onOpen}
      onSettings={onSettings}
    />,
    { auth: true },
  );
  expect(await screen.findByText("14 memories")).toBeInTheDocument();
  expect(screen.getByLabelText("2 unread messages")).toBeInTheDocument();
  expect(
    screen.queryByRole("img", { name: "Invitation pending" }),
  ).not.toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: "Options for Sam Smith" }),
  );
  await user.click(
    screen.getByRole("menuitem", { name: "Connection settings" }),
  );
  expect(onSettings).toHaveBeenCalledOnce();
  expect(onOpen).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Sam Smith Friend" }));
  expect(onOpen).toHaveBeenCalledOnce();
});

it("shows a pending clock and provides resend and cancel actions", async () => {
  const user = userEvent.setup();
  const onResend = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <PendingConnectionCard
      invite={{
        invite_id: "invite-1",
        name: "Ada",
        email: "ada@example.com",
        relationship: "Sister",
      }}
      selected={false}
      onOpen={vi.fn()}
      onResend={onResend}
      onCancel={onCancel}
    />,
  );
  expect(
    screen.getByRole("img", { name: "Invitation pending" }),
  ).toBeInTheDocument();
  expect(
    within(screen.getByRole("button", { name: "Ada Pending" })).getByText(
      "Pending invitation",
    ),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Options for Ada" }));
  await user.click(screen.getByRole("menuitem", { name: "Resend invite" }));
  expect(onResend).toHaveBeenCalledOnce();
  await user.click(screen.getByRole("button", { name: "Options for Ada" }));
  await user.click(screen.getByRole("menuitem", { name: "Cancel invite" }));
  expect(onCancel).toHaveBeenCalledOnce();
});

it("does not invent memory or unread counts when the count request fails", async () => {
  server.use(
    http.get("http://localhost:3000/api/people/person-1/settings", () =>
      HttpResponse.json({}, { status: 503 }),
    ),
  );
  renderWithProviders(
    <ConnectionCard
      person={person}
      selected={false}
      onOpen={vi.fn()}
      onSettings={vi.fn()}
    />,
    { auth: true },
  );
  expect(await screen.findByText("Memories unavailable")).toBeInTheDocument();
  expect(screen.queryByText("0 memories")).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/unread messages/)).not.toBeInTheDocument();
});

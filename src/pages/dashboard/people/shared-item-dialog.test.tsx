import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import { SharedItemDialog } from "./shared-item-dialog";
const person = {
  user_id: "tunde",
  name: "Tunde",
  avatar_url: null,
  relationship: "Friend",
  memento_state: "private" as const,
};
const url = "http://localhost:3000/api/people/tunde/items/item";
const item = {
  source_id: "item",
  title: "Our trip",
  body: "A sunny day",
  contributor: { user_id: "me", name: "Me" },
  original_date: "2026-01-01",
  attachments: [],
  can_remove: true,
};
it("recovers a failed detail request without claiming the memory was removed", async () => {
  let failed = true;
  server.use(
    http.get(url, () =>
      failed
        ? new HttpResponse(null, { status: 503 })
        : HttpResponse.json({ success: true, data: item }),
    ),
  );
  renderWithProviders(
    <SharedItemDialog
      person={person}
      sourceId="item"
      onClose={vi.fn()}
      onRemoved={vi.fn()}
    />,
  );
  const retry = await screen.findByRole("button", {
    name: "Retry loading shared memory",
  });
  expect(
    screen.queryByText("This shared memory is no longer available."),
  ).not.toBeInTheDocument();
  failed = false;
  await userEvent.click(retry);
  await screen.findByText("A sunny day");
});
it("does not offer confirmation when removal permission has been revoked", async () => {
  server.use(
    http.get(url, () =>
      HttpResponse.json({
        success: true,
        data: { ...item, can_remove: false },
      }),
    ),
  );
  renderWithProviders(
    <SharedItemDialog
      person={person}
      sourceId="item"
      confirmRemoval
      onClose={vi.fn()}
      onRemoved={vi.fn()}
    />,
  );
  await screen.findByText("A sunny day");
  expect(
    screen.queryByRole("button", { name: "Confirm removal" }),
  ).not.toBeInTheDocument();
});
it("guards removal while pending and retains confirmation after failure", async () => {
  let release!: () => void;
  let calls = 0;
  server.use(
    http.get(url, () => HttpResponse.json({ success: true, data: item })),
    http.delete(url, async () => {
      calls++;
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return new HttpResponse(null, { status: 503 });
    }),
  );
  const close = vi.fn();
  renderWithProviders(
    <SharedItemDialog
      person={person}
      sourceId="item"
      confirmRemoval
      onClose={close}
      onRemoved={vi.fn()}
    />,
  );
  await userEvent.click(
    await screen.findByRole("button", { name: "Confirm removal" }),
  );
  await waitFor(() => expect(calls).toBe(1));
  await userEvent.keyboard("{Escape}");
  expect(close).not.toHaveBeenCalled();
  expect(
    screen.getByRole("button", { name: "View original memory" }),
  ).toBeDisabled();
  release();
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Confirm removal" }),
    ).toBeEnabled(),
  );
  expect(calls).toBe(1);
});

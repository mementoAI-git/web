import { toast } from "sonner";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import { BlockedPeopleDialog, ConnectionSettingsDialog } from "./connection-settings";
const person = {
  user_id: "tunde",
  name: "Tunde",
  avatar_url: null,
  relationship: "Friend",
  memento_state: "private" as const,
};
it("requires confirmation before disconnecting and sends only the selected relationship", async () => {
  let request: unknown;
  server.use(
    http.get("http://localhost:3000/api/people/tunde/settings", () =>
      HttpResponse.json({
        success: true,
        data: {
          relationship: "Friend",
          shared_item_count: 2,
          privacy: "Only selected memories are shared.",
        },
      }),
    ),
    http.post(
      "http://localhost:3000/api/people/tunde/disconnect",
      async ({ request: req }) => {
        request = await req.json();
        return HttpResponse.json({ success: true, data: { removed: true } });
      },
    ),
  );
  const closed = vi.fn();
  renderWithProviders(
    <ConnectionSettingsDialog person={person} onClose={closed} />,
  );
  await screen.findByRole("button", { name: "Remove connection" });
  await userEvent.click(
    screen.getByRole("button", { name: "Remove connection" }),
  );
  expect(request).toBeUndefined();
  expect(
    screen.getByText(/Original memories stay with their authors/),
  ).toBeInTheDocument();
  await userEvent.click(
    screen.getByRole("button", { name: "Confirm removal" }),
  );
  await vi.waitFor(() => expect(closed).toHaveBeenCalled());
  expect(request).toEqual({ block: false });
});
it("saves a viewer-specific relationship label without modifying legacy access", async () => {
  let request: unknown;
  server.use(
    http.get("http://localhost:3000/api/people/tunde/settings", () =>
      HttpResponse.json({
        success: true,
        data: {
          relationship: "Friend",
          shared_item_count: 0,
          privacy: "Only selected memories are shared.",
        },
      }),
    ),
    http.patch(
      "http://localhost:3000/api/people/tunde/settings",
      async ({ request: req }) => {
        request = await req.json();
        return HttpResponse.json({
          success: true,
          data: { relationship: "Brother" },
        });
      },
    ),
  );
  renderWithProviders(
    <ConnectionSettingsDialog person={person} onClose={() => {}} />,
  );
  const field = await screen.findByLabelText("Relationship");
  await userEvent.clear(field);
  await userEvent.type(field, "Brother");
  await userEvent.click(
    screen.getByRole("button", { name: "Save" }),
  );
  await screen.findByText("Relationship saved.");
  expect(request).toEqual({ label: "Brother" });
});

it("updates an unblocked row even if its follow-up refresh fails", async () => {
  let removed = false;
  server.use(
    http.get("http://localhost:3000/api/people/blocked", () => removed
      ? HttpResponse.json({}, { status: 503 })
      : HttpResponse.json({ success: true, data: [{ user_id: "ada", name: "Ada" }] })),
    http.delete("http://localhost:3000/api/people/blocked/ada", () => {
      removed = true;
      return HttpResponse.json({ success: true });
    }),
  );
  renderWithProviders(<BlockedPeopleDialog onClose={() => {}} />, { auth: true });
  await screen.findByText("Ada");
  await userEvent.click(screen.getByRole("button", { name: "Unblock" }));
  await waitFor(() => expect(screen.queryByText("Ada")).not.toBeInTheDocument());
  expect(await screen.findByRole("button", { name: "Retry loading blocked people" })).toBeInTheDocument();
  expect(screen.queryByText("Couldn’t unblock this person. Try again.")).not.toBeInTheDocument();
});

it("keeps a failed unblock retryable and blocks duplicate requests and dismissal while pending", async () => {
  let release!: () => void;
  let requests = 0;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  const errorToast = vi.spyOn(toast, "error");
  server.use(
    http.get("http://localhost:3000/api/people/blocked", () => HttpResponse.json({ success: true, data: [{ user_id: "ada", name: "Ada" }] })),
    http.delete("http://localhost:3000/api/people/blocked/ada", async () => {
      requests++;
      await pending;
      return HttpResponse.json({}, { status: 503 });
    }),
  );
  const closed = vi.fn();
  renderWithProviders(<BlockedPeopleDialog onClose={closed} />, { auth: true });
  const unblock = await screen.findByRole("button", { name: "Unblock" });
  await userEvent.click(unblock);
  await waitFor(() => expect(requests).toBe(1));
  await userEvent.click(unblock);
  await userEvent.keyboard("{Escape}");
  expect(closed).not.toHaveBeenCalled();
  expect(requests).toBe(1);
  release();
  await waitFor(() => expect(unblock).toBeEnabled());
  expect(screen.getByText("Ada")).toBeInTheDocument();
  expect(errorToast).toHaveBeenCalledWith("Couldn’t unblock this person. Try again.");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  errorToast.mockRestore();
});

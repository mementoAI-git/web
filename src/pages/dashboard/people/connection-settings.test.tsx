import { toast } from "sonner";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import {
  BlockedPeopleDialog,
  ConnectionSettingsDialog,
} from "./connection-settings";
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
  const remove = await screen.findByRole("button", { name: "Remove connection" });
  expect(remove).toHaveClass("text-text-error-strong", "hover:text-text-error-strong", "border-stroke-error-strong/20");
  expect(screen.getByRole("dialog")).toHaveClass(
    "sm:max-w-[456px]",
    "rounded-3xl",
    "p-6",
  );
  expect(
    screen.getByRole("textbox", { name: "Saved display name" }),
  ).toHaveValue("Tunde");
  expect(screen.queryByLabelText("About this person")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Block person" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Remove connection" }),
  ).toHaveAttribute("data-variant", "outline");
  expect(screen.getByRole("button", { name: "Save" }).parentElement).toBe(
    screen.getByRole("button", { name: "Remove connection" }).parentElement,
  );
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
  const closed = vi.fn();
  renderWithProviders(
    <ConnectionSettingsDialog person={person} onClose={closed} />,
  );
  const field = await screen.findByLabelText("Relationship");
  await userEvent.clear(field);
  await userEvent.type(field, "Brother");
  await userEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(closed).toHaveBeenCalled());
  expect(request).toEqual({ label: "Brother" });
});

it("updates an unblocked row even if its follow-up refresh fails", async () => {
  let removed = false;
  server.use(
    http.get("http://localhost:3000/api/people/blocked", () =>
      removed
        ? HttpResponse.json({}, { status: 503 })
        : HttpResponse.json({
            success: true,
            data: [{ user_id: "ada", name: "Ada" }],
          }),
    ),
    http.delete("http://localhost:3000/api/people/blocked/ada", () => {
      removed = true;
      return HttpResponse.json({ success: true });
    }),
  );
  renderWithProviders(<BlockedPeopleDialog onClose={() => {}} />, {
    auth: true,
  });
  await screen.findByText("Ada");
  await userEvent.click(screen.getByRole("button", { name: "Unblock" }));
  await waitFor(() =>
    expect(screen.queryByText("Ada")).not.toBeInTheDocument(),
  );
  expect(
    await screen.findByRole("button", { name: "Retry loading blocked people" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByText("Couldn’t unblock this person. Try again."),
  ).not.toBeInTheDocument();
});

it("keeps a failed unblock retryable and blocks duplicate requests and dismissal while pending", async () => {
  let release!: () => void;
  let requests = 0;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const errorToast = vi.spyOn(toast, "error");
  server.use(
    http.get("http://localhost:3000/api/people/blocked", () =>
      HttpResponse.json({
        success: true,
        data: [{ user_id: "ada", name: "Ada" }],
      }),
    ),
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
  expect(errorToast).toHaveBeenCalledWith(
    "Couldn’t unblock this person. Try again.",
  );
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  errorToast.mockRestore();
});

it("clears group membership without changing hidden notes or existing access", async () => {
  let request: unknown;
  server.use(
    http.get("*/people/tunde/settings", () =>
      HttpResponse.json({
        success: true,
        data: {
          display_name: "Tunde",
          relationship: "Friend",
          email: "tunde@example.com",
          about: "Old note",
          access_scope: "capsules_only",
          groups: [{ id: "family", name: "Family", source: "group" }],
          shared_item_count: 0,
        },
      }),
    ),
    http.patch("*/people/tunde/settings", async ({ request: req }) => {
      request = await req.json();
      return HttpResponse.json({ success: true });
    }),
  );
  const closed = vi.fn();
  renderWithProviders(
    <ConnectionSettingsDialog person={person} onClose={closed} />,
  );
  expect(await screen.findByText("tunde@example.com")).toBeInTheDocument();
  expect(screen.getByLabelText("Access to your shared content")).toHaveValue(
    "capsules_only",
  );
  await userEvent.click(screen.getByRole("button", { name: "Family" }));
  await userEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(closed).toHaveBeenCalled());
  expect(request).toEqual({ label: "Friend", group_ids: [] });
});
it("opens removal directly without the edit form and keeps a failed removal retryable", async () => {
  server.use(
    http.post("*/people/tunde/disconnect", () =>
      HttpResponse.json({}, { status: 503 }),
    ),
  );
  const closed = vi.fn();
  renderWithProviders(
    <ConnectionSettingsDialog
      person={person}
      initialAction="remove"
      onClose={closed}
    />,
  );
  expect(screen.queryByLabelText("Saved display name")).not.toBeInTheDocument();
  await userEvent.click(
    screen.getByRole("button", { name: "Confirm removal" }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Confirm removal" }),
    ).toBeEnabled(),
  );
  expect(closed).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(closed).toHaveBeenCalled();
});

it("edits the name beside the clickable avatar", async () => {
  let payload: unknown;
  server.use(
    http.get("*/people/tunde/settings", () =>
      HttpResponse.json({
        success: true,
        data: {
          display_name: "Tunde",
          relationship: "Friend",
          groups: [],
          shared_item_count: 0,
        },
      }),
    ),
    http.patch("*/people/tunde/settings", async ({ request }) => {
      payload = await request.json();
      return HttpResponse.json({ success: true });
    }),
  );
  renderWithProviders(
    <ConnectionSettingsDialog person={person} onClose={() => {}} />,
  );
  const name = await screen.findByRole("textbox", {
    name: "Saved display name",
  });
  const input = screen.getByLabelText("Saved photo");
  expect(input).not.toBeVisible();
  const choosePhoto = vi.spyOn(input, "click");
  await userEvent.click(screen.getByRole("button", { name: "Edit photo" }));
  expect(choosePhoto).toHaveBeenCalledOnce();
  await userEvent.clear(name);
  await userEvent.type(name, "Dad");
  await userEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(payload).toEqual({ label: "Friend", display_name: "Dad" }),
  );
});

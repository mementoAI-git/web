import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import { useModal } from "@/hooks/use-modal";
import { StoreValueProvider, initialStates } from "@/hooks/use-store";
import { mockUser } from "@/test/fixtures";
import ActualPeoplePage from "./index";

function PeoplePage() {
  return (
    <StoreValueProvider value={{ ...initialStates, user: mockUser }}>
      <ActualPeoplePage />
    </StoreValueProvider>
  );
}

const base = "http://localhost:3000/api/people";
const tunde = {
  user_id: "person-tunde",
  name: "Tunde",
  avatar_url: null,
  relationship: "Friend",
  memento_state: "private",
};
function setup(connections = [tunde], pending: object[] = []) {
  server.use(
    http.get(base, () =>
      HttpResponse.json({ success: true, data: { connections, pending } }),
    ),
    http.get(`${base}/:id/space`, () =>
      HttpResponse.json({
        success: true,
        data: {
          shared_space_id: "our-space",
          items: [],
          page: 1,
          total: 0,
          has_next_page: false,
        },
      }),
    ),
  );
}
function ModalState() {
  const { state } = useModal();
  return <output data-testid="modal">{JSON.stringify(state[0])}</output>;
}

describe("PeoplePage", () => {
  it("opens the live connection settings from a selected person and retries its request", async () => {
    setup();
    let failed = true;
    server.use(http.get(`${base}/person-tunde/settings`, () => failed
      ? HttpResponse.json({}, { status: 503 })
      : HttpResponse.json({ success: true, data: { relationship: "Brother", shared_item_count: 0 } })));
    renderWithProviders(<PeoplePage />, { auth: true });
    await userEvent.click(await screen.findByRole("button", { name: "Tunde Friend" }));
    await userEvent.click(screen.getByRole("button", { name: "Connection settings" }));
    expect(screen.getByRole("dialog", { name: "Connection settings" })).toBeInTheDocument();
    const retry = await screen.findByRole("button", { name: "Retry loading connection settings" });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    failed = false;
    await userEvent.click(retry);
    expect(await screen.findByLabelText("Relationship")).toHaveValue("Brother");
  });

  it("opens the live blocked list from the sidebar and recovers without a false empty state", async () => {
    setup();
    let failed = true;
    server.use(http.get(`${base}/blocked`, () => failed
      ? HttpResponse.json({}, { status: 503 })
      : HttpResponse.json({ success: true, data: [{ user_id: "ada", name: "Ada" }] })));
    renderWithProviders(<PeoplePage />, { auth: true });
    await userEvent.click(screen.getByRole("button", { name: "Blocked people" }));
    expect(screen.getByRole("dialog", { name: "Blocked people" })).toBeInTheDocument();
    const retry = await screen.findByRole("button", { name: "Retry loading blocked people" });
    expect(screen.queryByText("You haven’t blocked anyone.")).not.toBeInTheDocument();
    failed = false;
    await userEvent.click(retry);
    expect(await screen.findByText("Ada")).toBeInTheDocument();
  });

  it("recovers the selected shared-space filter through the real workspace", async () => {
    setup();
    let failed = false;
    let requestedFilter: string | null = null;
    server.use(http.get(`${base}/person-tunde/space`, ({ request }) => {
      requestedFilter = new URL(request.url).searchParams.get("filter");
      return failed ? HttpResponse.json({}, { status: 503 }) : HttpResponse.json({ success: true, data: {
        shared_space_id: "space", items: [], page: 1, total: 0, has_next_page: false,
      } });
    }));
    renderWithProviders(<PeoplePage />, { auth: true });
    await userEvent.click(await screen.findByRole("button", { name: "Tunde Friend" }));
    await screen.findByRole("heading", { name: "Nothing here yet." });
    failed = true;
    await userEvent.click(screen.getByRole("button", { name: "Photos" }));
    const retry = await screen.findByRole("button", { name: "Retry loading shared memories" });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("No photos here yet.")).not.toBeInTheDocument();
    failed = false;
    await userEvent.click(retry);
    expect(await screen.findByText("No photos here yet.")).toBeInTheDocument();
    expect(requestedFilter).toBe("photos");
  });

  it("waits for the authenticated profile before claiming there are no connections", () => {
    renderWithProviders(<ActualPeoplePage />, { auth: true });
    expect(
      screen.getByRole("status", { name: "Loading people" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "No connections yet" }),
    ).not.toBeInTheDocument();
  });
  it("shows the empty state and reuses the invitation modal in connection mode", async () => {
    setup([]);
    renderWithProviders(
      <>
        <PeoplePage />
        <ModalState />
      </>,
      { auth: true },
    );
    expect(
      await screen.findByRole("heading", { name: "No connections yet" }),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getAllByRole("button", { name: "Invite someone" })[0],
    );
    expect(screen.getByTestId("modal")).toHaveTextContent(
      '"mode":"connection"',
    );
    expect(screen.getByTestId("modal")).toHaveTextContent(
      '"name":"add-beneficiary"',
    );
  });

  it("opens inactive connections in Our Space and never exposes a chat composer", async () => {
    setup();
    renderWithProviders(<PeoplePage />, { auth: true });
    await userEvent.click(
      await screen.findByRole("button", { name: "Tunde Friend" }),
    );
    expect(screen.getByRole("tab", { name: "Our Space" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      await screen.findByRole("heading", { name: "Nothing here yet." }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "Talk" }));
    expect(
      screen.getByRole("heading", {
        name: "Tunde’s Memento is private.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /message/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /voice call/i }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Our Space" }),
    );
    expect(screen.getByRole("tab", { name: "Our Space" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("searches connections without showing inbox mechanics", async () => {
    setup([tunde, { ...tunde, user_id: "person-ada", name: "Ada" }]);
    renderWithProviders(<PeoplePage />, { auth: true });
    await screen.findByRole("button", { name: "Ada Friend" });
    await userEvent.type(
      screen.getByRole("searchbox", { name: "Search people" }),
      "Tunde",
    );
    expect(
      screen.queryByRole("button", { name: "Ada Friend" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tunde Friend" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/online|unread/i)).not.toBeInTheDocument();
  });

  it("shows pending invitations without opening a shared space", async () => {
    setup(
      [],
      [{ invite_id: "invite-1", name: "Ada", email: "ada@example.com" }],
    );
    renderWithProviders(
      <>
        <PeoplePage />
        <ModalState />
      </>,
      { auth: true },
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Ada Pending" }),
    );
    expect(
      screen.getByRole("heading", { name: "Invitation pending" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "Our Space" }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Resend invite" }),
    );
    expect(screen.getByTestId("modal")).toHaveTextContent(
      '"name":"resend-invite"',
    );
  });

  it("distinguishes fetch failures from having no connections", async () => {
    server.use(
      http.get(base, () =>
        HttpResponse.json({ message: "Unavailable" }, { status: 503 }),
      ),
    );
    renderWithProviders(<PeoplePage />, { auth: true });
    expect(await screen.findByRole("button", { name: "Retry loading people" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "No connections yet" }),
    ).not.toBeInTheDocument();
    setup();
    await userEvent.click(
      screen.getByRole("button", { name: "Retry loading people" }),
    );
    expect(
      await screen.findByRole("button", { name: "Tunde Friend" }),
    ).toBeInTheDocument();
  });

  it("shows source provenance, opens original memories and requests media filters", async () => {
    setup();
    let requestedFilter: string | null = null;
    server.use(
      http.get(`${base}/:id/space`, ({ request }) => {
        requestedFilter = new URL(request.url).searchParams.get("filter");
        return HttpResponse.json({
          success: true,
          data: {
            shared_space_id: "space",
            page: 1,
            total: 1,
            has_next_page: false,
            items:
              requestedFilter === "photos"
                ? []
                : [
                    {
                      source_id: "source-1",
                      source_type: "story",
                      title: "Lagos trip",
                      body: "<p>A day together.</p><script>alert(1)</script>",
                      original_date: "2026-10-01T12:00:00Z",
                      contributor: {
                        user_id: "person-tunde",
                        name: "Tunde",
                        avatar_url: null,
                      },
                      shared_via: "group_visibility",
                      attachments: [],
                    },
                  ],
          },
        });
      }),
    );
    renderWithProviders(
      <>
        <PeoplePage />
        <ModalState />
      </>,
      { auth: true },
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Tunde Friend" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Lagos trip" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Shared from Tunde’s Memento · via a group"),
    ).toBeInTheDocument();
    expect(screen.getByText("A day together.")).toBeInTheDocument();
    expect(screen.queryByText("alert(1)")).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "View memory: Lagos trip" }),
    );
    expect(screen.getByTestId("modal")).toHaveTextContent(
      '"memoryId":"source-1"',
    );
    await userEvent.click(screen.getByRole("button", { name: "Photos" }));
    expect(
      await screen.findByRole("heading", { name: "No photos here yet." }),
    ).toBeInTheDocument();
    expect(requestedFilter).toBe("photos");
  });
});


it("opens the live contribution dialog from Our Space and preserves a rejected note", async () => {
  setup();
  let submitted: unknown;
  server.use(http.post(base + "/person-tunde/items", async ({ request }) => {
    submitted = await request.json();
    return HttpResponse.json({ message: "Temporarily unavailable" }, { status: 503 });
  }));
  renderWithProviders(<PeoplePage />, { auth: true });
  await userEvent.click(await screen.findByRole("button", { name: "Tunde Friend" }));
  await userEvent.click(screen.getAllByRole("button", { name: "Add memory", exact: true })[0]);
  await userEvent.click(screen.getByRole("button", { name: /Write a note/ }));
  await userEvent.type(screen.getByLabelText("Title"), "Keep this note");
  await userEvent.type(screen.getByLabelText("Your memory"), "A memory together");
  await userEvent.click(screen.getByRole("button", { name: "Add to Our Space" }));
  await waitFor(() => expect(submitted).toEqual({ title: "Keep this note", body: "A memory together", kind: "note", attachments: [] }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Add to Our Space" })).toBeEnabled());
  expect(screen.getByLabelText("Your memory")).toHaveValue("A memory together");
});

it("unblocks from the live sidebar dialog without restoring a connection", async () => {
  setup([], []);
  let blocked = true;
  server.use(
    http.get(base + "/blocked", () => HttpResponse.json({ success: true, data: blocked ? [{ user_id: "person-tunde", name: "Tunde" }] : [] })),
    http.delete(base + "/blocked/person-tunde", () => { blocked = false; return HttpResponse.json({ success: true }); }),
  );
  renderWithProviders(<PeoplePage />, { auth: true });
  await userEvent.click(screen.getByRole("button", { name: "Blocked people" }));
  await userEvent.click(await screen.findByRole("button", { name: "Unblock" }));
  await screen.findByText("You haven’t blocked anyone.");
  expect(screen.queryByRole("button", { name: "Tunde Friend" })).not.toBeInTheDocument();
});

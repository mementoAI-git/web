import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test";
import { StoreValueProvider, initialStates } from "@/hooks/use-store";
import { mockUser } from "@/test/fixtures";
import { ChatSwitcher } from "./chat-switcher";
const openModal = vi.fn();
vi.mock("@/hooks/use-modal", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/use-modal")>()),
  useModal: () => ({ open: openModal }),
}));

function Harness() {
  const location = useLocation();
  return (
    <StoreValueProvider value={{ ...initialStates, user: mockUser }}>
      <ChatSwitcher />
      <output data-testid="location">
        {location.pathname}
        {location.search}
      </output>
    </StoreValueProvider>
  );
}
describe("Memento switcher", () => {
  beforeEach(() => {
    server.use(
      http.get("*/people", () =>
        HttpResponse.json({
          success: true,
          data: {
            connections: [
              {
                user_id: "sarah",
                name: "Sarah Mitchell",
                relationship: "Friend",
                memento_state: "active",
                avatar_url: null,
              },
            ],
            pending: [],
          },
        }),
      ),
      http.get("*/people/sarah/settings", () =>
        HttpResponse.json({
          success: true,
          data: { relationship: "Friend", shared_item_count: 14 },
        }),
      ),
    );
  });
  it("switches contexts in Chat and restores the personal conversation route", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />, { route: "/chat/my-thread", auth: true });
    expect(
      screen.getByRole("button", { name: "My Memento" }),
    ).toHaveTextContent("Test User");
    await user.click(screen.getByRole("button", { name: "Change Memento" }));
    expect(screen.getByRole("dialog")).toHaveAccessibleName("Chat spaces");
    expect(
      screen.getByRole("button", { name: /My Memento.*personal conversation/ }),
    ).toHaveAttribute("aria-current", "true");
    await user.click(
      await screen.findByRole("button", { name: /Sarah Mitchell.*Friend/ }),
    );
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/chat/my-thread?person=sarah",
    );
    expect(
      screen.getByRole("button", { name: "About Sarah Mitchell" }),
    ).toHaveTextContent("Sarah Mitchell");
    await user.click(screen.getByRole("button", { name: "Change Memento" }));
    expect(
      screen.getByRole("button", { name: /Sarah Mitchell.*Friend/ }),
    ).toHaveAttribute("aria-current", "true");
    expect(
      screen.getByRole("button", { name: /My Memento.*personal conversation/ }),
    ).not.toHaveAttribute("aria-current");
    await user.click(
      screen.getByRole("button", { name: /My Memento.*personal conversation/ }),
    );
    expect(screen.getByTestId("location").textContent).toBe("/chat/my-thread");
  });
  it("shows relationship metadata under People", async () => {
    renderWithProviders(<Harness />, { route: "/chat/thread", auth: true });
    await userEvent.click(
      screen.getByRole("button", { name: "Change Memento" }),
    );
    expect(await screen.findByText("Friend • 14 memories")).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "People" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
  it("opens saved connection settings from the row menu without switching context", async () => {
    renderWithProviders(<Harness />, { route: "/chat/thread", auth: true });
    await userEvent.click(
      screen.getByRole("button", { name: "Change Memento" }),
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Options for Sarah Mitchell" }),
    );
    await userEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(
      await screen.findByRole("dialog", { name: "Connection settings" }),
    ).toBeInTheDocument();
    expect(await screen.findByLabelText("Saved display name")).toHaveValue(
      "Sarah Mitchell",
    );
    expect(screen.getByTestId("location")).toHaveTextContent("/chat/thread");
  });
  it("opens a connection from its exact three-action menu", async () => {
    renderWithProviders(<Harness />, {
      route: "/chat/thread?people=1",
      auth: true,
    });
    await userEvent.click(
      await screen.findByRole("button", { name: "Options for Sarah Mitchell" }),
    );
    expect(
      screen.getAllByRole("menuitem").map((item) => item.textContent),
    ).toEqual(["Open chat", "Edit", "Remove connection"]);
    await userEvent.click(screen.getByRole("menuitem", { name: "Open chat" }));
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/chat/thread?person=sarah",
    );
  });
  it("opens the existing removal confirmation without removing immediately", async () => {
    renderWithProviders(<Harness />, {
      route: "/chat/thread?people=1",
      auth: true,
    });
    await userEvent.click(
      await screen.findByRole("button", { name: "Options for Sarah Mitchell" }),
    );
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Remove connection" }),
    );
    expect(
      await screen.findByRole("button", { name: "Confirm removal" }),
    ).toBeInTheDocument();
  });
  it("keeps My Memento above Groups and reuses group actions", async () => {
    openModal.mockClear();
    server.use(
      http.get("*/groups", () =>
        HttpResponse.json({
          success: true,
          data: {
            docs: [{ _id: "family", name: "Family", members: ["sarah"] }],
            totalPages: 1,
          },
        }),
      ),
    );
    renderWithProviders(<Harness />, {
      route: "/chat/thread?people=1",
      auth: true,
    });
    await userEvent.click(screen.getByRole("tab", { name: "Groups" }));
    expect(
      screen.getByRole("button", { name: /My Memento.*personal conversation/ }),
    ).toBeInTheDocument();
    await userEvent.click(
      await screen.findByRole("button", { name: /Family.*1 member/ }),
    );
    expect(openModal).toHaveBeenCalledWith("group-detail", "family");
    await userEvent.click(screen.getByRole("button", { name: "Create group" }));
    expect(openModal).toHaveBeenCalledWith("add-group");
    await userEvent.click(screen.getByRole("tab", { name: "People" }));
    expect(
      await screen.findByRole("button", { name: /Sarah Mitchell.*Friend/ }),
    ).toBeInTheDocument();
  });
  it("shows pending invites in the Memento list with relationship metadata and menu actions", async () => {
    openModal.mockClear();
    server.use(
      http.get("*/people", () =>
        HttpResponse.json({
          success: true,
          data: {
            connections: [],
            pending: [
              {
                invite_id: "invite-1",
                name: "Alex Rivera",
                email: "alex@example.com",
                relationship: "Brother",
              },
            ],
          },
        }),
      ),
    );
    renderWithProviders(<Harness />, {
      route: "/chat/thread?people=1",
      auth: true,
    });
    const name = await screen.findByText("Alex Rivera");
    const card = name.closest(".relative")! as HTMLElement;
    expect(within(card).getByText("Brother")).toBeInTheDocument();
    expect(within(card).getByText("Pending")).toBeInTheDocument();
    expect(within(card).getByText("•")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByText("Pending invitations")).not.toBeInTheDocument();
    expect(
      within(card).queryByRole("button", { name: /Alex Rivera.*Brother/ }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      within(card).getByRole("button", { name: "Options for Alex Rivera" }),
    );
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Resend invite" }),
    );
    expect(openModal).toHaveBeenCalledWith("resend-invite", {
      email: "alex@example.com",
      mode: "connection",
    });
    await userEvent.click(
      within(card).getByRole("button", { name: "Options for Alex Rivera" }),
    );
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Cancel invite" }),
    );
    expect(openModal).toHaveBeenCalledWith("delete-beneficiary", {
      id: "invite-1",
      mode: "connection",
    });
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/chat/thread?people=1",
    );
  });
});

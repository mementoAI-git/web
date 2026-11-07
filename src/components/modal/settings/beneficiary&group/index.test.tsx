import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { useLocation } from "react-router-dom";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import PeopleAndGroups from "./index";

const base = "http://localhost:3000/api";
const group = {
  _id: "family",
  name: "Family",
  color: 0,
  created_at: "2025-03-08T12:00:00Z",
  members: [{ _id: "ada", name: "Ada Lovelace", email: "ada@example.com", relationship: "sister" }],
};

function Harness() {
  const location = useLocation();
  return (
    <>
      <PeopleAndGroups />
      <output data-testid="location">{location.pathname + location.search}</output>
    </>
  );
}

function setup(route: string) {
  server.use(
    http.get(`${base}/beneficiaries`, () =>
      HttpResponse.json({
        success: true,
        data: {
          docs: [
            { _id: "ada", name: "Ada Lovelace", email: "ada@example.com", relationship: "sister", accepted_at: "2025-03-08T12:00:00Z", groups: [] },
            { _id: "ben", name: "Ben Carter", email: "ben@example.com", relationship: "uncle", groups: [] },
          ],
        },
      }),
    ),
    http.get(`${base}/groups`, () =>
      HttpResponse.json({ success: true, data: { docs: [group], totalPages: 1 } }),
    ),
    http.get(`${base}/groups/family`, () =>
      HttpResponse.json({ success: true, data: group }),
    ),
  );
  renderWithProviders(<Harness />, { route, auth: true });
}

it("lists people without inventing data the API does not provide", async () => {
  setup("/settings/beneficiary");
  expect(await screen.findByRole("heading", { name: "Ada Lovelace" })).toBeInTheDocument();
  expect(screen.getByText("Sister")).toBeInTheDocument();
  expect(screen.getByText("Added Mar 8, 2025")).toBeInTheDocument();
  expect(screen.getByText("Invite pending")).toBeInTheDocument();
  expect(screen.queryByText(/shared memories/)).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Invite person" })).toBeInTheDocument();
});

it("offers resend only for pending invites", async () => {
  setup("/settings/beneficiary");
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "Options for Ben Carter" }));
  expect(await screen.findByRole("menuitem", { name: "Resend invite" })).toBeInTheDocument();
  await user.keyboard("{Escape}");
  await user.click(screen.getByRole("button", { name: "Options for Ada Lovelace" }));
  expect(await screen.findByRole("menuitem", { name: "Remove" })).toBeInTheDocument();
  expect(screen.queryByRole("menuitem", { name: "Resend invite" })).not.toBeInTheDocument();
});

it("keeps the Groups tab in the URL and links to each group", async () => {
  setup("/settings/beneficiary");
  await userEvent.click(await screen.findByRole("tab", { name: "Groups" }));
  expect(screen.getByTestId("location")).toHaveTextContent("/settings/beneficiary?view=groups");
  expect(screen.getByRole("button", { name: "New group" })).toBeInTheDocument();
  const link = await screen.findByRole("link", { name: /Family/ });
  expect(link).toHaveAttribute("href", "/settings/beneficiary?group=family");
  expect(within(link).getByText(/1 person/)).toBeInTheDocument();
});

it("shows a group's summary and members on its own page", async () => {
  setup("/settings/beneficiary?group=family");
  expect(await screen.findByRole("heading", { name: "Family", level: 2 })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Group summary" })).toHaveTextContent("Created Mar 8, 2025");
  expect(screen.getByRole("heading", { name: "Ada Lovelace" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Group settings" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Add new person" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back to groups" })).toHaveAttribute(
    "href",
    "/settings/beneficiary?view=groups",
  );
});

it("removes a member from the group through its menu", async () => {
  const removed = vi.fn();
  setup("/settings/beneficiary?group=family");
  server.use(
    http.delete(`${base}/groups/family/members/ada`, () => {
      removed();
      return HttpResponse.json({ success: true });
    }),
  );
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "Options for Ada Lovelace" }));
  await user.click(await screen.findByRole("menuitem", { name: "Remove from group" }));
  await vi.waitFor(() => expect(removed).toHaveBeenCalledOnce());
});

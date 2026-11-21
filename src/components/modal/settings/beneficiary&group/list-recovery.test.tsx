import { screen } from "@testing-library/react";
import { useSWRConfig } from "swr";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import Beneficiary from "./beneficiary";
import Groups from "./group";

const base = "http://localhost:3000/api";
const empty = { docs: [], totalDocs: 0, totalPages: 1, page: 1 };

function RefreshGroups() {
  const { mutate } = useSWRConfig();
  return <><button onClick={() => { void mutate("/groups?page=1&limit=25").catch(() => undefined); }}>Refresh groups</button><Groups /></>;
}

describe("settings list recovery", () => {
  it.each([
    { label: "connections", path: "/beneficiaries", Component: Beneficiary, emptyText: "No people yet" },
    { label: "groups", path: "/groups", Component: Groups, emptyText: "No groups yet" },
  ])("does not mistake failed $label for an empty list and retries", async ({ label, path, Component, emptyText }) => {
    let fail = true;
    server.use(http.get(`${base}${path}`, () => fail
      ? HttpResponse.json({}, { status: 503 })
      : HttpResponse.json({ success: true, data: empty })));
    renderWithProviders(<Component />, { auth: true });
    const retry = await screen.findByRole("button", { name: `Retry loading ${label}` });
    expect(screen.queryByText(emptyText)).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fail = false;
    await userEvent.setup().click(retry);
    expect(await screen.findByText(emptyText)).toBeInTheDocument();
  });

  it("keeps cached groups visible after a refresh failure", async () => {
    let failed = false;
    server.use(http.get(`${base}/groups`, () => failed
      ? HttpResponse.json({}, { status: 503 })
      : HttpResponse.json({ success: true, data: { ...empty, docs: [{ _id: "g1", name: "Family", members: [] }], totalDocs: 1 } })));
    renderWithProviders(<RefreshGroups />, { auth: true });
    await screen.findByText("Family");
    failed = true;
    await userEvent.setup().click(screen.getByRole("button", { name: "Refresh groups" }));
    await screen.findByRole("button", { name: "Retry loading groups" });
    expect(screen.getByText("Family")).toBeInTheDocument();
  });

  it("recovers from an empty later group page without claiming the library is empty", async () => {
    server.use(http.get(`${base}/groups`, ({ request }) => {
      const page = new URL(request.url).searchParams.get("page");
      return HttpResponse.json({ success: true, data: page === "2" ? empty : {
        docs: [{ _id: "group-1", name: "Family", members: [] }], totalPages: 2, totalDocs: 26, page: 1,
      } });
    }));
    renderWithProviders(<Groups />, { auth: true });
    await screen.findByText("Family");
    await userEvent.setup().click(screen.getByRole("button", { name: "Next page" }));
    expect(await screen.findByText("Family")).toBeInTheDocument();
    expect(screen.queryByText("No groups yet")).not.toBeInTheDocument();
  });
});

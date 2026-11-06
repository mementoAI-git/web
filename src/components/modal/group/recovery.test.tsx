import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import { AddGroupMembers } from "./add-group-members";
import { GroupDetail } from "./group-detail";
it("retries a failed beneficiary picker and keeps selections across pages", async () => {
  let failed = true;
  let submitted: unknown;
  server.use(
    http.get("http://localhost:3000/api/beneficiaries", ({ request }) => {
      if (failed) return new HttpResponse(null, { status: 503 });
      const page = new URL(request.url).searchParams.get("page");
      return HttpResponse.json({
        success: true,
        data: {
          docs: [
            {
              _id: page === "1" ? "ada" : "ben",
              name: page === "1" ? "Ada" : "Ben",
            },
          ],
          hasNextPage: page === "1",
        },
      });
    }),
    http.post(
      "http://localhost:3000/api/groups/family/members",
      async ({ request }) => {
        submitted = await request.json();
        return HttpResponse.json({ success: true });
      },
    ),
  );
  renderWithProviders(<AddGroupMembers data="family" />);
  const retry = await screen.findByRole("button", {
    name: "Retry loading beneficiaries",
  });
  expect(
    screen.queryByText("No beneficiaries to add."),
  ).not.toBeInTheDocument();
  failed = false;
  await userEvent.click(retry);
  await userEvent.click(
    await screen.findByRole("checkbox", { name: "Select Ada" }),
  );
  await userEvent.click(screen.getByRole("button", { name: "Next page" }));
  await userEvent.click(
    await screen.findByRole("checkbox", { name: "Select Ben" }),
  );
  await userEvent.click(screen.getByRole("button", { name: "Add to group" }));
  await waitFor(() =>
    expect(submitted).toEqual({ beneficiaryIds: ["ada", "ben"] }),
  );
});
it("offers only connections who are not already in the group", async () => {
  server.use(
    http.get("http://localhost:3000/api/beneficiaries", () =>
      HttpResponse.json({
        success: true,
        data: {
          docs: [
            { _id: "ada", name: "Ada" },
            { _id: "ben", name: "Ben" },
          ],
        },
      }),
    ),
    http.get("http://localhost:3000/api/groups/family", () =>
      HttpResponse.json({
        success: true,
        data: { _id: "family", name: "Family", members: [{ _id: "ada", name: "Ada" }] },
      }),
    ),
  );
  renderWithProviders(<AddGroupMembers data="family" />);
  expect(await screen.findByRole("checkbox", { name: "Select Ben" })).toBeInTheDocument();
  await waitFor(() =>
    expect(screen.queryByRole("checkbox", { name: "Select Ada" })).not.toBeInTheDocument(),
  );
  expect(screen.getByRole("dialog", { name: "Add people" })).toBeInTheDocument();
  expect(screen.queryByPlaceholderText("John Doe")).not.toBeInTheDocument();
});
it("removes the last member from cache even when the subsequent refresh fails", async () => {
  let failed = false;
  server.use(
    http.get("http://localhost:3000/api/groups/family", () =>
      failed
        ? new HttpResponse(null, { status: 503 })
        : HttpResponse.json({
            success: true,
            data: {
              _id: "family",
              name: "Family",
              members: [{ _id: "ada", name: "Ada" }],
            },
          }),
    ),
    http.delete("http://localhost:3000/api/groups/family/members/ada", () => {
      failed = true;
      return HttpResponse.json({ success: true, data: null });
    }),
  );
  renderWithProviders(<GroupDetail data="family" />);
  await userEvent.click(
    await screen.findByRole("button", { name: "Remove member" }),
  );
  await waitFor(() =>
    expect(screen.queryByText("Ada")).not.toBeInTheDocument(),
  );
  await screen.findByRole("button", { name: "Retry loading group" });
  failed = false;
});

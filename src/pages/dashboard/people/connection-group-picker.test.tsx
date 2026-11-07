import { useState } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders, server } from "@/test";
import { GROUP_COLORS } from "@/utility/constant";
import { ConnectionGroupPicker } from "./connection-group-picker";
import type { GroupSearchResultItem } from "@/components/modal/beneficiary/add-beneficiary/select-group";
function Harness() {
  const [value, setValue] = useState<GroupSearchResultItem[]>([]);
  return (
    <ConnectionGroupPicker value={value} onChange={setValue} disabled={false} />
  );
}
it("shows compact group pills with exact assigned colours and toggles membership", async () => {
  server.use(
    http.get("*/groups", () =>
      HttpResponse.json({
        success: true,
        data: {
          docs: [
            { _id: "family", name: "Family", color: 1 },
            { _id: "friends", name: "Friends", color: 3 },
          ],
          totalPages: 1,
        },
      }),
    ),
  );
  renderWithProviders(<Harness />);
  const family = await screen.findByRole("button", { name: "Family" });
  const friends = screen.getByRole("button", { name: "Friends" });
  expect(family).toHaveClass(...GROUP_COLORS[1].split(" "));
  expect(friends).toHaveClass(...GROUP_COLORS[3].split(" "));
  expect(friends).toHaveClass("min-h-6", "text-xs", "px-2", "py-0.5");
  expect(friends).not.toHaveClass("opacity-70", "min-h-9");
  expect(friends.parentElement).not.toHaveClass("p-3", "bg-fill-neutral-weak", "border", "rounded-xl");
  const palette = family.className;
  expect(family).toHaveAttribute("aria-pressed", "false");
  await userEvent.click(family);
  expect(family).toHaveAttribute("aria-pressed", "true");
  expect(family.className).toBe(palette);
  await userEvent.click(family);
  expect(family).toHaveAttribute("aria-pressed", "false");
});
it("offers retry when groups cannot be loaded", async () => {
  server.use(
    http.get("*/groups", () => HttpResponse.json({}, { status: 503 })),
  );
  renderWithProviders(<Harness />);
  expect(
    await screen.findByRole("button", { name: "Retry loading groups" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("No groups yet.")).not.toBeInTheDocument();
});

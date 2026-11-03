import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AudiencePicker, type Audience } from "./audience-picker";
import type { IBeneficiary, IGroup } from "@/utility/interface";

const people = [
  { _id: "person-1", name: "Alexander Wang" },
  { _id: "person-2", name: "Lisa Doherty" },
] as IBeneficiary[];
const groups = [{ _id: "group-1", name: "Family" }] as IGroup[];
function Picker() {
  const [value, setValue] = useState<Audience>({
    visibility: "private",
    people: [],
    groups: [],
  });
  return (
    <AudiencePicker
      value={value}
      onChange={setValue}
      people={people}
      groups={groups}
      loading={false}
      error={false}
      disabled={false}
    />
  );
}
it("starts private, searches people and groups, and shows selected chips", async () => {
  const user = userEvent.setup();
  render(<Picker />);
  expect(
    screen.getByRole("button", { name: "Choose visibility" }),
  ).toHaveTextContent("Private - Only you can see this");
  await user.click(screen.getByRole("button", { name: "Choose visibility" }));
  await user.type(
    screen.getByRole("textbox", { name: "Search user or group" }),
    "Family",
  );
  expect(
    screen.queryByRole("checkbox", { name: "Alexander Wang" }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole("checkbox", { name: "Family" }));
  await user.clear(
    screen.getByRole("textbox", { name: "Search user or group" }),
  );
  await user.click(screen.getByRole("checkbox", { name: "Alexander Wang" }));
  expect(
    screen.getByRole("button", { name: "Choose visibility" }),
  ).toHaveTextContent("@Family@Alexander Wang");
  await user.click(screen.getByRole("button", { name: "Everyone" }));
  expect(
    screen.getByRole("button", { name: "Choose visibility" }),
  ).toHaveTextContent("Everyone - Visible to everyone");
  expect(screen.getByRole("checkbox", { name: "Family" })).not.toBeChecked();
});

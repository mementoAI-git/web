import { useState } from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import { ActivationDialog } from "./activation-dialog";
it("restores keyboard focus to the opener after closing a separately mounted People dialog", async () => {
  server.use(
    http.get("http://localhost:3000/api/people/activation", () =>
      HttpResponse.json({
        success: true,
        data: { state: "private", approved_context: "", updated_at: null },
      }),
    ),
  );
  function Example() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>Availability</button>
        {open && <ActivationDialog onClose={() => setOpen(false)} />}
      </>
    );
  }
  renderWithProviders(<Example />);
  const opener = screen.getByRole("button", { name: "Availability" });
  await userEvent.click(opener);
  await screen.findByRole("dialog");
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(opener).toHaveFocus());
});

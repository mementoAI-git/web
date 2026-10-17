import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import { StoreValueProvider, initialStates } from "@/hooks/use-store";
import { mockUser } from "@/test/fixtures";
import { ActivationDialog } from "./activation-dialog";

function setup(approved_context = "", profileBio = "I enjoy gardening.") {
  const save = vi.fn();
  server.use(
    http.get("http://localhost:3000/api/people/activation", () =>
      HttpResponse.json({
        success: true,
        data: { state: "private", approved_context, updated_at: null },
      }),
    ),
    http.put(
      "http://localhost:3000/api/people/activation",
      async ({ request }) => {
        const payload = (await request.json()) as {
          approved_context: string;
          active: boolean;
        };
        save(payload);
        return HttpResponse.json({
          success: true,
          data: {
            state: payload.active ? "active" : "ready",
            approved_context: payload.approved_context,
            updated_at: null,
          },
        });
      },
    ),
  );
  renderWithProviders(
    <StoreValueProvider
      value={{
        ...initialStates,
        user: {
          ...mockUser,
          context: {
            ...mockUser.context,
            self_description: profileBio,
            conversation_history_summary: "Private chat content",
            important_notes: ["Private note"],
          },
        },
      }}
    >
      <ActivationDialog onClose={() => {}} />
    </StoreValueProvider>,
  );
  return save;
}

it("prepares the profile introduction but only shares it after explicit approval", async () => {
  const save = setup();
  await screen.findByText("I enjoy gardening.");
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(screen.queryByText("Private chat content")).not.toBeInTheDocument();
  expect(screen.queryByText("Private note")).not.toBeInTheDocument();
  expect(save).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "Enable Memento" }));
  await screen.findByRole("button", { name: "Make private" });
  expect(save).toHaveBeenLastCalledWith({
    approved_context: "I enjoy gardening.",
    active: true,
  });
  await userEvent.click(screen.getByRole("button", { name: "Make private" }));
  await screen.findByRole("button", { name: "Enable Memento" });
  expect(save).toHaveBeenLastCalledWith({
    approved_context: "I enjoy gardening.",
    active: false,
  });
});

it("preserves approved content and lets the owner edit it before enabling", async () => {
  const save = setup("My approved introduction.");
  await screen.findByText("My approved introduction.");
  await userEvent.click(screen.getByRole("button", { name: "Edit" }));
  const field = screen.getByLabelText("Your introduction");
  await userEvent.clear(field);
  expect(screen.getByRole("button", { name: "Enable Memento" })).toBeDisabled();
  await userEvent.type(field, "I love painting.");
  expect(save).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "Enable Memento" }));
  await screen.findByRole("button", { name: "Make private" });
  expect(save).toHaveBeenLastCalledWith({
    approved_context: "I love painting.",
    active: true,
  });
});

it("reuses the saved About me introduction when the basic profile has no biography", async () => {
  server.use(
    http.get("http://localhost:3000/api/users/persona", () =>
      HttpResponse.json({
        success: true,
        data: {
          self_description: "I make pottery.",
          important_notes: ["Not approved for sharing"],
        },
      }),
    ),
  );
  const save = setup("", "");
  await screen.findByText("I make pottery.");
  expect(
    screen.queryByText("Not approved for sharing"),
  ).not.toBeInTheDocument();
  expect(save).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "Enable Memento" }));
  await screen.findByRole("button", { name: "Make private" });
  expect(save).toHaveBeenLastCalledWith({
    approved_context: "I make pottery.",
    active: true,
  });
});

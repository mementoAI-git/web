import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import { TalkWorkspace } from "./talk-workspace";
const person = {
  user_id: "tunde",
  name: "Tunde",
  avatar_url: null,
  relationship: "Friend",
  memento_state: "active" as const,
};
it("loads a private transcript, sends through the connection route and opens scoped citations", async () => {
  let request: unknown;
  server.use(
    http.get("http://localhost:3000/api/people/tunde/talk", () =>
      HttpResponse.json({
        success: true,
        data: { available: true, turns: [] },
      }),
    ),
    http.post(
      "http://localhost:3000/api/people/tunde/talk",
      async ({ request: req }) => {
        request = await req.json();
        return HttpResponse.json({
          success: true,
          data: {
            id: "answer",
            role: "ai",
            text: "A memory of a walk.",
            available: true,
            created_at: "2026-10-11",
            is_voice: false,
            citations: [{ source_id: "walk", title: "The walk" }],
          },
        });
      },
    ),
  );
  renderWithProviders(<TalkWorkspace person={person} />);
  const input = await screen.findByRole("textbox", {
    name: "Message Tunde’s Memento",
  });
  await userEvent.type(input, "What do you remember?");
  await userEvent.click(screen.getByRole("button", { name: "Send message" }));
  await screen.findByText("A memory of a walk.");
  expect(request).toMatchObject({
    text: "What do you remember?",
    is_voice: false,
  });
  expect(
    screen.getByRole("button", { name: "From Our Space: The walk" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/Tunde can’t read this conversation/),
  ).toBeInTheDocument();
});
it("does not show a composer when the server says the Memento was deactivated", async () => {
  server.use(
    http.get("http://localhost:3000/api/people/tunde/talk", () =>
      HttpResponse.json({
        success: true,
        data: { available: false, turns: [] },
      }),
    ),
  );
  renderWithProviders(<TalkWorkspace person={person} />);
  await screen.findByText("This Memento is no longer active.");
  expect(
    screen.queryByRole("textbox", { name: "Message Tunde’s Memento" }),
  ).not.toBeInTheDocument();
});

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { server } from "@/test/mocks/server";
import Bubble from "./bubble";
import { splitConfirmations } from "./memento-links";

const API = "http://localhost:3000/api";
const CHAT = "64b7f0c2a1b2c3d4e5f60733";
const ACTION = "64b7f0c2a1b2c3d4e5f60999";
const done = { tool: "rename_story", memory: CHAT, text: 'Done: renamed "Trip to Lagos" to "Lagos 2019".', action: ACTION };
const block = (kind: string, card: object) => `\n\n\`\`\`${kind}\n${JSON.stringify(card)}\n\`\`\``;

describe("what Memento did, with Undo", () => {
  it("takes done cards out of the reply's words", () => {
    expect(splitConfirmations(`Renamed it.${block("memento-done", done)}`)).toEqual({
      text: "Renamed it.",
      cards: [],
      dones: [{ ...done, undone: false }],
    });
    expect(splitConfirmations(`x${block("memento-undone", done)}`).dones[0].undone).toBe(true);
    expect(splitConfirmations('Sure.\n\n```memento-done\n{"tool":').text).toBe("Sure.");
  });

  it("undoes exactly that action from its card", async () => {
    let body: unknown;
    server.use(
      http.post(`${API}/ai/chat/undo`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true, data: { done: true, text: 'Undone: renamed "Trip to Lagos" to "Lagos 2019".', effects: [] } });
      }),
    );
    renderWithProviders(<Bubble role="ai" text={`Renamed it.${block("memento-done", done)}`} />, { auth: true });
    expect(screen.getByRole("group", { name: "What Memento did" })).toHaveTextContent(done.text);
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(await screen.findByText('Undone: renamed "Trip to Lagos" to "Lagos 2019".')).toBeVisible();
    expect(body).toEqual({ memory: CHAT, action: ACTION });
    expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument();
  });

  it("offers no Undo on a card already undone, or one that cannot be undone", () => {
    renderWithProviders(
      <Bubble role="ai" text={`a${block("memento-undone", done)}${block("memento-done", { ...done, action: undefined, text: "Done: sent your feedback to the Memento team." })}`} />,
      { auth: true },
    );
    expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument();
    expect(screen.getByText("Done: sent your feedback to the Memento team.")).toBeVisible();
  });

  it("shows the new text before the host confirms replacing a story's words", () => {
    const card = { tool: "edit_story", memory: CHAT, args: { query: "Lagos", text: "We landed at night.", mode: "replace", confirmation: "ABCDEFGH" }, text: 'Replace all the words of "Trip to Lagos".' };
    renderWithProviders(<Bubble role="ai" text={`Shall I?${block("memento-confirm", card)}`} />, { auth: true });
    expect(screen.getByLabelText("The new text")).toHaveTextContent("We landed at night.");
  });
});

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { renderWithProviders, server } from "@/test";
import DailyPromptSection from "./daily-prompt-section";
import { useModal } from "@/hooks/use-modal";
function ModalState() {
  const { state } = useModal();
  return <output data-testid="modal">{JSON.stringify(state)}</output>;
}
it.each(["static", "ai"] as const)(
  "opens a %s daily question as a topic conversation, including answered cards",
  async (kind) => {
    let received: unknown;
    server.use(
      http.get("*/prompts", () =>
        HttpResponse.json({
          data: [
            kind === "ai"
              ? {
                  slot_kind: "ai",
                  display_label: "Daily",
                  answered: true,
                  ai_prompt_text: "A meaningful moment?",
                  reflection_day_key: "2026-10-31",
                }
              : {
                  slot_kind: "static",
                  display_label: "Daily",
                  answered: false,
                  prompt: { _id: "question-1", title: "A meaningful moment?" },
                  reflection_day_key: "2026-10-31",
                },
          ],
        }),
      ),
      http.post("*/prompts/reflection/conversation", async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({
          success: true,
          data: { _id: "reflection-1" },
        });
      }),
    );
    function EntryState() {
      received = useLocation().state?.reflectionEntry?.request;
      return <h1>Reflection conversation</h1>;
    }
    renderWithProviders(
      <>
        <Routes>
          <Route path="/overview" element={<DailyPromptSection />} />
          <Route
            path="/chat/reflection/:id"
            element={<EntryState/>}
          />
        </Routes>
        <ModalState />
      </>,
      { auth: true, route: "/overview" },
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Reflect on Daily" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Reflection conversation" }),
    ).toBeVisible();
    expect(received).toMatchObject({
      prompt_type: kind === "ai" ? "ai-generated" : "static",
      reflection_day_key: "2026-10-31",
    });
    expect(screen.getByTestId("modal")).not.toHaveTextContent("quick-capture");
  },
);

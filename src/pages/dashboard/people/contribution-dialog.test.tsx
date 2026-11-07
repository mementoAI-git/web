import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import { ContributionDialog } from "./contribution-dialog";
const person = {
  user_id: "incoming-person",
  name: "Tunde",
  avatar_url: null,
  relationship: "Friend",
  memento_state: "private" as const,
};
describe("People contribution actions", () => {
  it("targets the selected person directly when writing a note", async () => {
    let body: unknown;
    server.use(
      http.post(
        "http://localhost:3000/api/people/incoming-person/items",
        async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({
            success: true,
            data: { source_id: "note" },
          });
        },
      ),
    );
    renderWithProviders(
      <ContributionDialog
        person={person}
        onClose={() => {}}
        onSaved={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Write a note/ }));
    await userEvent.type(screen.getByLabelText("Title"), "Our first trip");
    await userEvent.type(
      screen.getByLabelText("Your memory"),
      "I remember the rain.",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Add to Our Space" }),
    );
    await screen.findByText("Added to Our Space");
    expect(body).toEqual({
      title: "Our first trip",
      body: "I remember the rain.",
      kind: "note",
      attachments: [],
    });
  });
  it("offers all four actions and shares an existing source without copying it", async () => {
    let body: unknown;
    server.use(
      http.get("http://localhost:3000/api/people/sources", () =>
        HttpResponse.json({
          success: true,
          data: {
            items: [
              {
                source_id: "source-1",
                title: "A holiday",
                original_date: "2026-01-01",
              },
            ],
            page: 1,
            has_next_page: false,
          },
        }),
      ),
      http.post(
        "http://localhost:3000/api/people/incoming-person/share",
        async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({
            success: true,
            data: { source_id: "source-1" },
          });
        },
      ),
    );
    renderWithProviders(
      <ContributionDialog
        person={person}
        onClose={() => {}}
        onSaved={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Record audio/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Upload media/ }),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: /Choose a memory/ }),
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Share A holiday" }),
    );
    await screen.findByText("Added to Our Space");
    expect(body).toEqual({ source_id: "source-1" });
  });
  it("returns from the embedded recorder to the action menu when it is closed", async () => {
    renderWithProviders(
      <ContributionDialog
        person={person}
        onClose={() => {}}
        onSaved={() => {}}
      />,
    );
    vi.stubGlobal("MediaRecorder", class {});
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: () => new Promise(() => {}) },
    });
    await userEvent.click(screen.getByRole("button", { name: /Record audio/ }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel recording" }));
    expect(
      screen.getByRole("button", { name: /Write a note/ }),
    ).toBeInTheDocument();
  });
});

it("keeps the note draft and guards duplicate submits/dismissal during a failed save", async () => {
  let release!: () => void;
  let calls = 0;
  server.use(
    http.post(
      "http://localhost:3000/api/people/incoming-person/items",
      async () => {
        calls++;
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        return new HttpResponse(null, { status: 503 });
      },
    ),
  );
  const close = vi.fn();
  renderWithProviders(
    <ContributionDialog person={person} onClose={close} onSaved={vi.fn()} />,
  );
  await userEvent.click(screen.getByRole("button", { name: /Write a note/ }));
  await userEvent.type(screen.getByLabelText("Title"), "Our trip");
  await userEvent.type(screen.getByLabelText("Your memory"), "A sunny day");
  await userEvent.dblClick(
    screen.getByRole("button", { name: "Add to Our Space" }),
  );
  await waitFor(() => expect(calls).toBe(1));
  await userEvent.keyboard("{Escape}");
  expect(close).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Title")).toBeDisabled();
  release();
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Add to Our Space" }),
    ).toBeEnabled(),
  );
  expect(screen.getByLabelText("Your memory")).toHaveValue("A sunny day");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
it("retries the source library without losing the search query", async () => {
  let failed = true;
  server.use(
    http.get("http://localhost:3000/api/people/sources", () =>
      failed
        ? new HttpResponse(null, { status: 503 })
        : HttpResponse.json({
            success: true,
            data: { items: [], page: 1, has_next_page: false },
          }),
    ),
  );
  renderWithProviders(
    <ContributionDialog person={person} onClose={vi.fn()} onSaved={vi.fn()} />,
  );
  await userEvent.click(
    screen.getByRole("button", { name: /Choose a memory/ }),
  );
  await screen.findByRole("button", { name: "Retry loading memories" });
  await userEvent.type(
    screen.getByRole("textbox", { name: "Search your memories" }),
    "holiday",
  );
  const retry = await screen.findByRole("button", {
    name: "Retry loading memories",
  });
  failed = false;
  await userEvent.click(retry);
  await screen.findByText("No memories match your search.");
  expect(
    screen.getByRole("textbox", { name: "Search your memories" }),
  ).toHaveValue("holiday");
});

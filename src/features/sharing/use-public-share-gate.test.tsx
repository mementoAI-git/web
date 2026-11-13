import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, server } from "@/test";
import { usePublicShareGate } from "./use-public-share-gate";

const API = "http://localhost:3000/api";
const LINK = "https://memento.test/post/story-1";
const story = { _id: "story-1", title: "T", body: "B", status: "save", attachments: [], tags: [] };

const update = vi.fn();
function serve(memory: Record<string, unknown>, putStatus = 200) {
  server.use(
    http.get(`${API}/memories/story-1`, () =>
      HttpResponse.json({ success: true, data: { ...story, ...memory } }),
    ),
    http.put(`${API}/memories/story-1`, async ({ request }) => {
      update(await request.json());
      return putStatus === 200
        ? HttpResponse.json({ success: true, data: {} })
        : HttpResponse.json({ success: false, message: "Nope" }, { status: putStatus });
    }),
  );
}

function Harness() {
  const { ready, copy, open, dialog } = usePublicShareGate("story-1");
  return (
    <>
      <button type="button" disabled={!ready} onClick={() => copy(LINK, "Link copied")}>Copy</button>
      <button type="button" disabled={!ready} onClick={() => open(`https://social.test/share?u=${LINK}`)}>Social</button>
      {dialog}
    </>
  );
}

async function renderReady() {
  renderWithProviders(<Harness />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Copy" })).toBeEnabled());
}

let popup: { location: { href: string }; opener: unknown; close: ReturnType<typeof vi.fn> };
beforeEach(() => {
  update.mockClear();
  popup = { location: { href: "" }, opener: window, close: vi.fn() };
  vi.spyOn(window, "open").mockImplementation(() => popup as unknown as Window);
});
afterEach(() => vi.restoreAllMocks());

describe("sharing a story link", () => {
  it("shares a public story at once, without asking or saving", async () => {
    serve({ visibility: "everyone" });
    const user = userEvent.setup();
    await renderReady();
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(await navigator.clipboard.readText()).toBe(LINK);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
  });

  it("asks before making a private story public, and changes nothing on Cancel", async () => {
    serve({ visibility: "private" });
    const user = userEvent.setup();
    await renderReady();
    await navigator.clipboard.writeText("before");
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(await screen.findByRole("alertdialog", { name: "Make this story public?" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Keep private" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(update).not.toHaveBeenCalled();
    expect(await navigator.clipboard.readText()).toBe("before");
  });

  it("makes it public and copies the link once confirmed", async () => {
    serve({ visibility: "private", beneficiaries: ["b1"] });
    const user = userEvent.setup();
    await renderReady();
    await user.click(screen.getByRole("button", { name: "Copy" }));
    await user.click(await screen.findByRole("button", { name: "Make public and copy" }));
    await waitFor(() =>
      expect(update).toHaveBeenCalledExactlyOnceWith({ visibility: "everyone", groups: [], beneficiaries: [] }),
    );
    expect(await navigator.clipboard.readText()).toBe(LINK);
  });

  it("opens the share window during the click, then sends it on once public", async () => {
    serve({ visibility: "private" });
    const user = userEvent.setup();
    await renderReady();
    await user.click(screen.getByRole("button", { name: "Social" }));
    await user.click(await screen.findByRole("button", { name: "Make public and share" }));
    // Opened blank inside the click so the browser doesn't block it.
    expect(window.open).toHaveBeenCalledWith("", "share", expect.any(String));
    await waitFor(() => expect(popup.location.href).toBe(`https://social.test/share?u=${LINK}`));
    expect(popup.opener).toBeNull();
    expect(update).toHaveBeenCalledOnce();
  });

  it("closes the share window if the story could not be made public", async () => {
    serve({ visibility: "private" }, 500);
    const user = userEvent.setup();
    await renderReady();
    await user.click(screen.getByRole("button", { name: "Social" }));
    await user.click(await screen.findByRole("button", { name: "Make public and share" }));
    await waitFor(() => expect(popup.close).toHaveBeenCalled());
    expect(popup.location.href).toBe("");
  });

  it("refuses a draft: its link never opens for others", async () => {
    vi.spyOn(toast, "error");
    serve({ visibility: "everyone", status: "draft" });
    const user = userEvent.setup();
    await renderReady();
    await user.click(screen.getByRole("button", { name: "Copy" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/Publish this story before sharing it/)),
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
  });
});

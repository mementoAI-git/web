import { describe, it, expect } from "vitest";
import { screen, within, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, delay } from "msw";
import { renderWithProviders, server } from "@/test";
import RecentStoriesSection from "./recent-stories-section";

const story = (index: number, attachments: object[] = []) => ({
  _id: `story-${index}`,
  title: `Story ${index}`,
  created_at: `2026-10-${String(17 - index).padStart(2, "0")}T12:00:00Z`,
  attachments,
});
const photo = {
  _id: "photo-1",
  name: "photo.jpg",
  type: "image/jpeg",
  size: 100,
  url: "https://example.com/photo.jpg",
  thumbnail: "https://example.com/thumb.jpg",
};
function respond(docs: object[]) {
  server.use(
    http.get("*/memories", () => HttpResponse.json({ data: { docs } })),
  );
}
function renderSection() {
  return renderWithProviders(<RecentStoriesSection />, {
    route: "/overview",
    auth: true,
  });
}

describe("Recent stories", () => {
  it("requests the three newest saved stories and caps the list at three", async () => {
    let query: URLSearchParams | undefined;
    server.use(
      http.get("*/memories", ({ request }) => {
        query = new URL(request.url).searchParams;
        return HttpResponse.json({
          data: { docs: Array.from({ length: 6 }, (_, i) => story(i)) },
        });
      }),
    );
    renderSection();
    expect(
      await screen.findByRole("link", { name: /^Story 0/ }),
    ).toHaveAttribute("href", "/stories/story-0");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.queryByText("Story 3")).not.toBeInTheDocument();
    expect(query?.get("limit")).toBe("3");
    expect(query?.get("sort")).toBe("-created_at");
    expect(query?.get("page")).toBe("1");
    // Each story is a filled card strip drawn with theme tokens, so it follows every theme.
    expect(screen.getByRole("link", { name: /^Story 0/ })).toHaveClass(
      "sky-card",
      "rounded-2xl",
      "border-stroke-neutral-weak",
      "bg-fill-neutral-weak",
    );
    expect(
      screen.getByRole("heading", { name: /recent stories/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See all" })).toHaveAttribute(
      "href",
      "/stories",
    );
  });

  it("uses thumbnails and the Explore identicon for stories without artwork", async () => {
    respond([
      story(0, [photo]),
      story(1),
      story(2, [
        {
          ...photo,
          type: "audio/mpeg",
          name: "voice.mp3",
          thumbnail: undefined,
        },
      ]),
    ]);
    const { container } = renderSection();
    await screen.findByRole("link", { name: /^Story 0/ });
    const images = container.querySelectorAll("li img");
    expect(images[0]).toHaveAttribute("src", photo.thumbnail);
    expect(images[1]).toHaveAttribute(
      "src",
      "https://api.dicebear.com/10.x/disco/svg?seed=story-1",
    );
    expect(images[2]).toHaveAttribute(
      "src",
      "https://api.dicebear.com/10.x/disco/svg?seed=story-2",
    );
    fireEvent.error(images[0]);
    await waitFor(() =>
      expect(images[0]).toHaveAttribute(
        "src",
        "https://api.dicebear.com/10.x/disco/svg?seed=story-0",
      ),
    );
  });

  it("keeps prompt story titles consistent with the stories library", async () => {
    respond([
      { ...story(0), prompt_type: "static", prompt_text: "A childhood memory" },
    ]);
    renderSection();
    expect(
      await screen.findByRole("link", { name: /^A childhood memory/ }),
    ).toHaveAttribute("href", "/chat/reflection/story-0");
  });

  it("offers to add a story when there are none", async () => {
    respond([]);
    renderSection();
    expect(await screen.findByText("No stories added yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add story" })).toBeEnabled();
    const seeAll = screen.getByText("See all");
    expect(seeAll).toHaveAttribute("aria-disabled", "true");
    expect(seeAll).toHaveClass("text-text-neutral-disabled");
    expect(screen.queryByRole("link", { name: "See all" })).not.toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("shows loading placeholders until the stories arrive", async () => {
    server.use(
      http.get("*/memories", async () => {
        await delay(100);
        return HttpResponse.json({ data: { docs: [story(0)] } });
      }),
    );
    renderSection();
    expect(
      screen.getByRole("status", { name: "Loading recent stories" }),
    ).toBeInTheDocument();
    await screen.findByRole("link", { name: /^Story 0/ });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("offers a working retry when stories fail to load", async () => {
    server.use(
      http.get("*/memories", () => new HttpResponse(null, { status: 500 })),
    );
    renderSection();
    const alert = await screen.findByRole("alert");
    expect(
      within(alert).getByText(/couldn’t load your stories/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/your story begins here/i),
    ).not.toBeInTheDocument();
    respond([story(0)]);
    await userEvent
      .setup()
      .click(within(alert).getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("link", { name: /^Story 0/ }),
    ).toBeInTheDocument();
  });
});

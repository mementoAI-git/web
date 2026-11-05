import { beforeEach, describe, it, expect } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import { useLocation } from "react-router-dom";
import { reflectionAvatars } from "./reflection-avatars";
import DailyPromptSection from "./daily-prompt-section";

function CaptureState() {
  const location = useLocation();
  return (
    <output data-testid="capture-state">
      {JSON.stringify({ path: location.pathname, payload: location.state?.reflectionEntry?.request })}
    </output>
  );
}

let shufflesUsed = 0;
beforeEach(() => {
  shufflesUsed = 0;
  const usage = () => ({
    used: shufflesUsed,
    remaining: 2 - shufflesUsed,
    resets_at: new Date(Date.now() + 86400000).toISOString(),
  });
  server.use(
    http.get("http://localhost:3000/api/prompts/shuffle", () =>
      HttpResponse.json({ data: usage() }),
    ),
    http.post("http://localhost:3000/api/prompts/shuffle", () => {
      const allowed = shufflesUsed < 2;
      if (allowed) shufflesUsed++;
      return HttpResponse.json({ data: { ...usage(), allowed } });
    }),
  );
});

describe("DailyPromptSection", () => {
  it("allows only two shuffles and keeps the allowance after remounting", async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithProviders(<DailyPromptSection />, {
      route: "/overview",
      auth: true,
    });
    const shuffle = screen.getByRole("button", { name: "Shuffle reflections" });
    await waitFor(() => expect(shuffle).toBeEnabled());
    await user.click(shuffle);
    await waitFor(() => expect(shufflesUsed).toBe(1));
    await waitFor(() => expect(shuffle).toBeEnabled());
    await user.click(shuffle);
    await waitFor(() => expect(shufflesUsed).toBe(2));
    await waitFor(() => expect(shuffle).toBeDisabled());
    await user.click(shuffle);
    expect(shufflesUsed).toBe(2);
    unmount();
    renderWithProviders(<DailyPromptSection />, {
      route: "/overview",
      auth: true,
    });
    await screen.findByText(
      "Daily shuffle limit reached. Resets at midnight UTC.",
    );
    expect(
      screen.getByRole("button", { name: "Shuffle reflections" }),
    ).toBeDisabled();
  });

  it("uses the server's exhausted allowance when another device used the last shuffle", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DailyPromptSection />, {
      route: "/overview",
      auth: true,
    });
    const shuffle = screen.getByRole("button", { name: "Shuffle reflections" });
    await waitFor(() => expect(shuffle).toBeEnabled());
    shufflesUsed = 2;
    await user.click(shuffle);
    await waitFor(() => expect(shuffle).toBeDisabled());
    expect(shufflesUsed).toBe(2);
  });

  it("shows all returned prompts together in separate cards without tabs", async () => {
    renderWithProviders(<DailyPromptSection />, {
      route: "/overview",
      auth: true,
    });
    const personalized = await screen.findByRole("article", {
      name: "Just for you",
    });
    expect(
      within(personalized).getByRole("button", {
        name: "Reflect on Just for you",
      }),
    ).toBeInTheDocument();
    const family = screen.getByRole("article", { name: "Prompt 2" });
    expect(
      within(family).getByRole("button", { name: "Reflect on Prompt 2" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("article", { name: "Prompt 3" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });

  it("highlights a defining word while preserving the full question and capture payload", async () => {
    const text = "How do you express appreciation to someone you care about?";
    server.use(
      http.get("http://localhost:3000/api/prompts", () =>
        HttpResponse.json({
          data: [
            {
              slot_kind: "ai",
              display_label: "Just for you",
              answered: false,
              ai_prompt_text: text,
              reflection_day_key: "2026-10-05",
            },
          ],
        }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <DailyPromptSection />
        <CaptureState />
      </>,
      { route: "/overview", auth: true },
    );
    const card = await screen.findByRole("article", { name: "Just for you" });
    const button = within(card).getByRole("button", {
      name: "Reflect on Just for you",
    });
    expect(button.textContent).toBe(text);
    expect(button.querySelector("i")).toHaveTextContent("appreciation");
    expect(button.querySelector("i")).toHaveClass("text-text-brand-strong");
    await user.click(button);
    await waitFor(() =>
      expect(screen.getByTestId("capture-state")).toHaveTextContent(text),
    );
  });

  it("opens the conversation with the prompt belonging to each card", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <DailyPromptSection />
        <CaptureState />
      </>,
      { route: "/overview", auth: true },
    );
    const personalized = await screen.findByRole("article", {
      name: "Just for you",
    });
    await user.click(
      within(personalized).getByRole("button", { name: /reflect on/i }),
    );
    await waitFor(() =>
      expect(screen.getByTestId("capture-state")).toHaveTextContent(
        '"prompt_type":"ai-generated"',
      ),
    );
    const family = screen.getByRole("article", { name: "Prompt 2" });
    await user.click(
      within(family).getByRole("button", { name: /reflect on/i }),
    );
    await waitFor(() =>
      expect(screen.getByTestId("capture-state")).toHaveTextContent(
        '"prompt_id":"prompt-1"',
      ),
    );
    await waitFor(() =>
      expect(screen.getByTestId("capture-state")).toHaveTextContent(
        '"prompt_type":"static"',
      ),
    );
  });

  it("uses different cinematic avatar stacks and replaces every face when shuffled", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DailyPromptSection />, {
      route: "/overview",
      auth: true,
    });
    await screen.findByRole("article", { name: "Just for you" });
    const labels = ["Prompt 2", "Prompt 3"];
    const imagesForCard = (label: string) => [
      ...screen.getByRole("article", { name: label }).querySelectorAll("img"),
    ];
    const previous = labels.map((label) =>
      imagesForCard(label).map((image) => image.getAttribute("src")),
    );
    expect(new Set(previous.flat()).size).toBe(
      Math.min(6, reflectionAvatars.length),
    );
    for (const label of labels) {
      for (const image of imagesForCard(label)) {
        expect(image).toHaveAttribute("loading", "lazy");
        expect(image).toHaveAttribute("decoding", "async");
        expect(image).toHaveAttribute("width", "24");
        expect(image).toHaveAttribute("height", "24");
      }
    }
    await user.click(
      screen.getByRole("button", { name: "Shuffle reflections" }),
    );
    await waitFor(() => expect(shufflesUsed).toBe(1));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Shuffle reflections" }),
      ).toBeEnabled(),
    );
    labels.forEach((label, index) => {
      const next = imagesForCard(label).map((image) =>
        image.getAttribute("src"),
      );
      expect(next).toHaveLength(Math.min(3, reflectionAvatars.length));
      if (reflectionAvatars.length >= 6)
        expect(next.every((src) => !previous[index].includes(src))).toBe(true);
    });
  });

  it("shows exact reply-user totals above 30 and stable varied floors for small totals", async () => {
    server.use(
      http.get("http://localhost:3000/api/prompts", () =>
        HttpResponse.json({
          data: [
            {
              slot_kind: "ai",
              display_label: "Personal",
              answered: false,
              ai_prompt_text: "What brings you joy?",
              reflection_day_key: "2026-10-06",
              reply_user_count: 0,
            },
            ...[12, 12345].map((count, index) => ({
              slot_kind: "static",
              display_label: `Static ${index}`,
              answered: false,
              reflection_day_key: "2026-10-06",
              reply_user_count: count,
              prompt: {
                _id: `count-prompt-${index}`,
                title: `Reflect on memory ${index}`,
                type: "general",
                tags: [],
                created_at: "",
                updated_at: "",
              },
            })),
          ],
        }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<DailyPromptSection />, {
      route: "/overview",
      auth: true,
    });
    await screen.findByRole("article", { name: "Personal" });
    const countText = (label: string) =>
      within(screen.getByRole("article", { name: label })).getByText(
        /^[\d,]+ people$/,
      ).textContent!;
    const personal = screen.getByRole("article", { name: "Personal" });
    expect(within(personal).getByText("For you")).toBeInTheDocument();
    expect(within(personal).queryByText(/people$/)).not.toBeInTheDocument();
    expect(personal.querySelector("img")).toBeNull();
    const staticCount = countText("Static 0");
    expect(Number(staticCount.split(" ")[0])).toBeGreaterThanOrEqual(30);
    expect(countText("Static 1")).toBe("12,345 people");
    expect(screen.queryByText(/32k/)).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Shuffle reflections" }),
    );
    expect(within(personal).getByText("For you")).toBeInTheDocument();
    expect(countText("Static 0")).toBe(staticCount);
    expect(countText("Static 1")).toBe("12,345 people");
  });

  it("keeps answered prompts available to reopen their conversation", async () => {
    server.use(
      http.get("http://localhost:3000/api/prompts", () =>
        HttpResponse.json({
          data: [
            {
              slot_kind: "ai",
              display_label: "Just for you",
              answered: true,
              ai_prompt_text: "Your reflection",
              reflection_day_key: "2026-10-05",
            },
          ],
        }),
      ),
    );
    renderWithProviders(<DailyPromptSection />, {
      route: "/overview",
      auth: true,
    });
    const card = await screen.findByRole("article", { name: "Just for you" });
    expect(
      within(card).getByText(/already shared a reflection/i),
    ).toBeInTheDocument();
    expect(
      within(card).getByRole("button", { name: "Reflect on Just for you" }),
    ).toBeEnabled();
  });
  it("shuffles the cards while preserving their capture payloads", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <DailyPromptSection />
        <CaptureState />
      </>,
      { route: "/overview", auth: true },
    );
    await screen.findByRole("article", { name: "Just for you" });
    await user.click(
      screen.getByRole("button", { name: "Shuffle reflections" }),
    );
    await waitFor(() =>
      expect(screen.getAllByRole("article")[0]).toHaveAccessibleName(
        "Prompt 2",
      ),
    );
    await user.click(
      within(screen.getAllByRole("article")[0]).getByRole("button"),
    );
    await waitFor(() =>
      expect(screen.getByTestId("capture-state")).toHaveTextContent(
        '"prompt_id":"prompt-1"',
      ),
    );
  });

  it("shows an empty state and disables shuffle when no prompts are returned", async () => {
    server.use(
      http.get("http://localhost:3000/api/prompts", () =>
        HttpResponse.json({ data: [] }),
      ),
    );
    renderWithProviders(<DailyPromptSection />, {
      route: "/overview",
      auth: true,
    });
    expect(
      await screen.findByText(/no reflections available today/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Shuffle reflections" }),
    ).toBeDisabled();
  });
});

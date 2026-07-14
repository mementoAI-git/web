import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import { AutogenerateTagsButton } from "./AutogenerateTagsButton";

const tagsTaskRunMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

vi.mock("@/features/ai/use-ai-task", () => ({
  useAiTask: () => ({
    run: tagsTaskRunMock,
    isRunning: false,
  }),
}));

describe("AutogenerateTagsButton", () => {
  beforeEach(() => {
    tagsTaskRunMock.mockReset();
    toastErrorMock.mockReset();
  });

  it("uses the shared AI task layer to suggest tags", async () => {
    const user = userEvent.setup();
    const onTagsGenerated = vi.fn();
    tagsTaskRunMock.mockResolvedValue({
      result: { tags: ["Family", "Home", "Tradition"] },
    });

    renderWithProviders(
      <AutogenerateTagsButton
        title=""
        body="We all sat around the table again."
        onTagsGenerated={onTagsGenerated}
      />,
      { auth: true },
    );

    await user.click(screen.getByRole("button", { name: /autotag/i }));

    expect(tagsTaskRunMock).toHaveBeenCalledWith({
      body: "We all sat around the table again.",
    });
    expect(onTagsGenerated).toHaveBeenCalledWith([
      "Family",
      "Home",
      "Tradition",
    ]);
  });

  it("guards against empty input before calling the task", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AutogenerateTagsButton
        title=""
        body=""
        onTagsGenerated={vi.fn()}
      />,
      { auth: true },
    );

    await user.click(screen.getByRole("button", { name: /autotag/i }));

    expect(tagsTaskRunMock).not.toHaveBeenCalled();
    expect(toastErrorMock).toHaveBeenCalledWith(
      "Enter a title or some content to generate tags",
    );
  });
});

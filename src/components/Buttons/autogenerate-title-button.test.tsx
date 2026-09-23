import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import { AutogenerateTitleButton } from "./AutogenerateTitleButton";

const titleTaskRunMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

vi.mock("@/features/ai/use-ai-task", () => ({
  useAiTask: () => ({
    run: titleTaskRunMock,
    isRunning: false,
  }),
}));

describe("AutogenerateTitleButton", () => {
  beforeEach(() => {
    titleTaskRunMock.mockReset();
    toastErrorMock.mockReset();
  });

  it("uses the shared AI task layer to suggest a title", async () => {
    const user = userEvent.setup();
    const onTitle = vi.fn();
    titleTaskRunMock.mockResolvedValue({
      result: { title: "Sunday Dinner" },
    });

    renderWithProviders(
      <AutogenerateTitleButton
        draftTitle=""
        bodyPlain="We all sat around the table again."
        onTitle={onTitle}
      />,
      { auth: true },
    );

    await user.click(screen.getByRole("button", { name: /suggest title/i }));

    expect(titleTaskRunMock).toHaveBeenCalledWith({
      body: "We all sat around the table again.",
    });
    expect(onTitle).toHaveBeenCalledWith("Sunday Dinner");
  });

  it("guards against empty input before calling the task", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AutogenerateTitleButton draftTitle="" bodyPlain="" onTitle={vi.fn()} />,
      { auth: true },
    );

    await user.click(screen.getByRole("button", { name: /suggest title/i }));

    expect(titleTaskRunMock).not.toHaveBeenCalled();
    expect(toastErrorMock).toHaveBeenCalledWith(
      "Add some story text or a title to suggest from",
    );
  });
});

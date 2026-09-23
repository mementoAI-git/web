import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import { storageKeys } from "@/utility/constant";
import HostOnboardingChatScreen from "./host-onboarding-chat-screen";

function introContinueButton() {
  return screen.getByRole("button", { name: /Alright, let's go/i });
}

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/api/onboarding", () => ({
  skipOnboarding: vi.fn().mockResolvedValue({ success: true }),
}));

describe("HostOnboardingChatScreen", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    localStorage.removeItem(storageKeys.hostOnboardingChat);
  });

  it("with persist false, skips intro and streams first assistant with chips", async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <HostOnboardingChatScreen assistantPreDelayMs={0} persist={false} nickname="Alex" />,
      {
        route: "/onboard/chat",
        auth: true,
      },
    );

    await waitFor(() => {
      expect(
        screen.getByText(/glad you're here/i),
      ).toBeInTheDocument();
    });

    const gladHere = screen.getByText(/glad you're here/i);
    const assistantBubble = gladHere.closest(".self-start");
    expect(assistantBubble).toBeTruthy();
    expect(assistantBubble).toHaveClass("max-w-[75%]");

    const scrollPane = container.querySelector(".hide-scrollbar");
    const idleOrb = scrollPane?.querySelector("video");
    expect(idleOrb).toBeTruthy();
    expect(idleOrb?.parentElement).toHaveClass("size-[40px]");

    await user.click(screen.getByRole("button", { name: /Family stories/i }));
    const field = screen.getByLabelText(/Your reply/i);
    expect(field).toHaveValue("Family stories");

    await user.click(screen.getByRole("button", { name: /^Send$/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/say a bit more when you're ready/i),
      ).toBeInTheDocument();
    });
  });

  it("intro view lists hero heading before continue button", async () => {
    const { container } = renderWithProviders(
      <HostOnboardingChatScreen assistantPreDelayMs={0} persist={true} nickname="Alex" />,
      {
        route: "/onboard/chat",
        auth: true,
      },
    );

    await waitFor(() => {
      expect(screen.getByText(/Okay, Alex/i)).toBeInTheDocument();
    });

    const orb = container.querySelector("video");
    expect(orb).toBeTruthy();
    expect(orb?.parentElement).toHaveClass("size-[60px]");
    expect(orb).toHaveAttribute("loop");
    expect(orb).toHaveAttribute("autoplay");
    expect(orb).toHaveAttribute("playsinline");
    expect((orb as HTMLVideoElement).muted).toBe(true);

    const heading = screen.getByRole("heading", {
      name: /Okay, Alex\. I've got some questions for you\./i,
    });
    const continueBtn = introContinueButton();
    expect(
      heading.compareDocumentPosition(continueBtn) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("intro continues with default reply when Alright, let's go is pressed", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <HostOnboardingChatScreen assistantPreDelayMs={0} persist={true} nickname="Alex" />,
      {
        route: "/onboard/chat",
        auth: true,
      },
    );

    await waitFor(() => {
      expect(screen.getByText(/Okay, Alex/i)).toBeInTheDocument();
    });

    await user.click(introContinueButton());

    await waitFor(() => {
      expect(
        screen.getByText(/say a bit more when you're ready/i),
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByText(/what feels most important about alright, i'm ready\?/i),
      ).toBeInTheDocument();
    });
  });

  it("with persist true, intro then streamed assistant after ready reply", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <HostOnboardingChatScreen assistantPreDelayMs={0} persist={true} nickname="Alex" />,
      {
        route: "/onboard/chat",
        auth: true,
      },
    );

    await waitFor(() => {
      expect(screen.getByText(/Okay, Alex/i)).toBeInTheDocument();
    });
    expect(
      screen.getByText(/personalize your experience on the product/i),
    ).toBeInTheDocument();

    await user.click(introContinueButton());

    await waitFor(() => {
      expect(
        screen.getByText(/say a bit more when you're ready/i),
      ).toBeInTheDocument();
    });
  });

  it("reset clears chat and navigates to /onboarding to restart funnel", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <HostOnboardingChatScreen assistantPreDelayMs={0} persist={true} nickname="Alex" />,
      {
        route: "/onboard/chat",
        auth: true,
      },
    );

    await waitFor(() => {
      expect(screen.getByText(/Okay, Alex/i)).toBeInTheDocument();
    });
    await user.click(introContinueButton());
    await waitFor(() => {
      expect(
        screen.getByText(/say a bit more when you're ready/i),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /^Reset$/i }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/onboarding", {
        replace: true,
      });
    });
  });

  it("skip navigates to overview after skipOnboarding", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <HostOnboardingChatScreen assistantPreDelayMs={0} persist={false} nickname="Alex" />,
      {
        route: "/onboard/chat",
        auth: true,
      },
    );

    await waitFor(() => {
      expect(screen.getByText(/glad you're here/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Skip for now/i }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/overview");
    });
  });

  it("shows structured handoff summary when onboarding completes", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <HostOnboardingChatScreen assistantPreDelayMs={0} persist={false} nickname="Alex" />,
      {
        route: "/onboard/chat",
        auth: true,
      },
    );

    await waitFor(() => {
      expect(screen.getByText(/glad you're here/i)).toBeInTheDocument();
    });

    for (let i = 0; i < 7; i++) {
      const field = await screen.findByLabelText(/Your reply/i);
      await user.clear(field);
      await user.type(field, `reply ${i + 1}`);
      await user.click(screen.getByRole("button", { name: /^Send$/i }));
    }

    await waitFor(() => {
      expect(screen.getByText(/we'll carry this forward/i)).toBeInTheDocument();
      expect(
        screen.getByText(/you care about family stories and want a simple way to begin/i),
      ).toBeInTheDocument();
    });
  });
});

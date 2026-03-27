import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import { storageKeys } from "@/utility/constant";
import OnboardingGrootPage from "./index";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

async function advanceThroughAllSteps(
  user: ReturnType<typeof userEvent.setup>,
  options?: {
    motivation?: string | RegExp;
    expression?: string | RegExp;
    /** When true (e.g. revisit with prefill), skip clicking expression so prefill is kept */
    skipExpressionClick?: boolean;
  }
) {
  // Step 1: full name + nickname
  await user.type(
    screen.getByLabelText(/what's your full name/i),
    "Jane Doe"
  );
  await user.type(
    screen.getByLabelText(/what do people closest to you call you/i),
    "Jane"
  );
  await user.click(screen.getByRole("button", { name: /continue/i }));

  // Step 2: age, where from (optional), who for
  await user.click(screen.getByRole("button", { name: /30s–40s/i }));
  await user.click(screen.getByRole("button", { name: /my children/i }));
  await user.click(screen.getByRole("button", { name: /continue/i }));

  // Step 3: passions
  await user.click(screen.getByRole("button", { name: /music/i }));
  await user.click(screen.getByRole("button", { name: /continue/i }));

  // Step 4: life context
  await user.click(screen.getByRole("button", { name: /still working/i }));
  await user.click(screen.getByRole("button", { name: /continue/i }));

  // Step 5: motivation
  const motivation =
    options?.motivation ?? /people I love to truly know me/i;
  await user.click(screen.getByRole("button", { name: motivation }));
  await user.click(screen.getByRole("button", { name: /continue/i }));

  // Step 6: dimensions
  await user.click(screen.getByRole("button", { name: /relationships & people/i }));
  await user.click(screen.getByRole("button", { name: /continue/i }));

  // Step 7: expression (skip if prefill already has one selected, to avoid toggling off)
  if (!options?.skipExpressionClick) {
    const expression = options?.expression ?? /talking — I prefer to speak/i;
    await user.click(screen.getByRole("button", { name: expression }));
  }
  await user.click(screen.getByRole("button", { name: /almost there/i }));
}

describe("OnboardingGrootPage", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.removeItem(storageKeys.onboardingState);
  });

  it("renders step 1 with full name and nickname inputs", () => {
    renderWithProviders(<OnboardingGrootPage />, {
      route: "/onboarding",
      auth: true,
    });
    expect(screen.getByLabelText(/what's your full name/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/what do people closest to you call you/i)
    ).toBeInTheDocument();
  });

  it("advances to step 2 when valid and Continue clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingGrootPage />, {
      route: "/onboarding",
      auth: true,
    });
    await user.type(
      screen.getByLabelText(/what's your full name/i),
      "Jane Doe"
    );
    await user.type(
      screen.getByLabelText(/what do people closest to you call you/i),
      "Jane"
    );
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByText(/how old are you/i)).toBeInTheDocument();
  });

  it("shows validation when advancing without required fields", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingGrootPage />, {
      route: "/onboarding",
      auth: true,
    });
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(
      screen.getByText(/we'd love to know your full name/i)
    ).toBeInTheDocument();
  });

  it("goes back from step 2 to step 1", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingGrootPage />, {
      route: "/onboarding",
      auth: true,
    });
    await user.type(
      screen.getByLabelText(/what's your full name/i),
      "Jane Doe"
    );
    await user.type(
      screen.getByLabelText(/what do people closest to you call you/i),
      "Jane"
    );
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(screen.getByText("← Back"));
    expect(
      screen.getByLabelText(/what's your full name/i)
    ).toBeInTheDocument();
  });

  it("shows Skip for now link on step 1", () => {
    renderWithProviders(<OnboardingGrootPage />, {
      route: "/onboarding",
      auth: true,
    });
    expect(screen.getByText("Skip for now →")).toBeInTheDocument();
  });

  it(
    "voice_recorder CTA navigates to overview with create-memory modal",
    async () => {
      const user = userEvent.setup();
      renderWithProviders(<OnboardingGrootPage />, {
        route: "/onboarding",
        auth: true,
      });
      await advanceThroughAllSteps(user);
      await user.click(
        screen.getByRole("button", { name: /record your first memory/i }),
      );
      expect(mockNavigate).toHaveBeenCalledWith("/overview", {
        state: { openModal: "create-memory" },
      });
    },
    15_000,
  );

  it(
    "revisit mode hides Skip and shows Save changes on step 8",
    async () => {
      const user = userEvent.setup();
      renderWithProviders(<OnboardingGrootPage />, {
        route: "/onboarding?mode=revisit",
        auth: true,
      });
      // Wait for prefill to load (GET /users/onboarding-details) then form to render
      expect(await screen.findByLabelText(/what's your full name/i)).toBeInTheDocument();
      expect(screen.queryByText("Skip for now →")).not.toBeInTheDocument();
      await advanceThroughAllSteps(user, { skipExpressionClick: true });
      expect(
        await screen.findByRole("button", { name: /save changes/i }),
      ).toBeInTheDocument();
    },
    15_000,
  );

  it(
    "time_capsule CTA navigates to /capsule",
    async () => {
      const user = userEvent.setup();
      renderWithProviders(<OnboardingGrootPage />, {
        route: "/onboarding",
        auth: true,
      });
      await advanceThroughAllSteps(user, {
        motivation: /I'm being practical about the future/i,
        expression: /guided questions/i,
      });
      await user.click(
        screen.getByRole("button", { name: /create your first time capsule/i }),
      );
      expect(mockNavigate).toHaveBeenCalledWith("/capsule");
    },
    15_000,
  );
});

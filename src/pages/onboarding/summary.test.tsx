import { afterEach, describe, expect, it } from "vitest";
import { Route, Routes, useLocation } from "react-router-dom";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "@/test";

import SummaryPage from "./summary";
import {
  ONBOARDING_SUMMARY_STORAGE_KEY,
  type OnboardingSummarySnapshot,
} from "./summary-helpers";

function seedSummarySnapshot(snapshot: OnboardingSummarySnapshot) {
  sessionStorage.setItem(
    ONBOARDING_SUMMARY_STORAGE_KEY,
    JSON.stringify(snapshot),
  );
}

function ChatLocationEcho() {
  const location = useLocation();
  const starter = new URLSearchParams(location.search).get("starter");
  return <div>{starter}</div>;
}

describe("OnboardingSummaryPage", () => {
  afterEach(() => {
    sessionStorage.removeItem(ONBOARDING_SUMMARY_STORAGE_KEY);
  });

  it("renders live enrichment score and onboarding coverage", async () => {
    seedSummarySnapshot({
      nextAction: "dashboard",
      skippedDeepPersonalization: false,
      touchedCategories: ["identity_self", "heritage_roots"],
      priorityDimensions: ["heritage_roots"],
      motivationType: "memory_preservation",
      nickname: "Jane",
    });

    renderWithProviders(
      <Routes>
        <Route path="/onboarding/summary" element={<SummaryPage />} />
      </Routes>,
      { route: "/onboarding/summary", auth: true },
    );

    expect(
      await screen.findByText(/you have already filled in 24% of your memento/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /jane, you have already started shaping the story only you can tell/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Identity & Self")).toBeInTheDocument();
    expect(screen.getByText("Heritage & Roots")).toBeInTheDocument();
    expect(
      screen.getByText(/other parts of your story can wait until you are ready/i),
    ).toBeInTheDocument();
  });

  it("goes to the dashboard from the left rail and clears the snapshot", async () => {
    const user = userEvent.setup();
    seedSummarySnapshot({
      nextAction: "dashboard",
      skippedDeepPersonalization: false,
      touchedCategories: ["identity_self"],
      priorityDimensions: [],
      motivationType: "explorer",
      nickname: "Jane",
    });

    renderWithProviders(
      <Routes>
        <Route path="/onboarding/summary" element={<SummaryPage />} />
        <Route path="/overview" element={<div>Overview route</div>} />
      </Routes>,
      { route: "/onboarding/summary", auth: true },
    );

    await user.click(await screen.findByRole("button", { name: /go to dashboard/i }));
    expect(await screen.findByText("Overview route")).toBeInTheDocument();
    expect(sessionStorage.getItem(ONBOARDING_SUMMARY_STORAGE_KEY)).toBeNull();
  });

  it("shows the alternate next-step button when the suggested destination is not the dashboard", async () => {
    const user = userEvent.setup();
    seedSummarySnapshot({
      nextAction: "reflection_prompt",
      skippedDeepPersonalization: false,
      touchedCategories: ["identity_self"],
      priorityDimensions: [],
      motivationType: "explorer",
      nickname: "Jane",
    });

    renderWithProviders(
      <Routes>
        <Route path="/onboarding/summary" element={<SummaryPage />} />
        <Route path="/explore" element={<div>Explore route</div>} />
      </Routes>,
      { route: "/onboarding/summary", auth: true },
    );

    await user.click(await screen.findByRole("button", { name: /browse prompts/i }));
    expect(await screen.findByText("Explore route")).toBeInTheDocument();
    expect(sessionStorage.getItem(ONBOARDING_SUMMARY_STORAGE_KEY)).toBeNull();
  });

  it("opens host chat with a personalized starter and clears the snapshot", async () => {
    const user = userEvent.setup();
    seedSummarySnapshot({
      nextAction: "dashboard",
      skippedDeepPersonalization: false,
      touchedCategories: ["identity_self"],
      priorityDimensions: ["relationships_people"],
      motivationType: "memory_preservation",
      nickname: "Jane",
      lifeSituation: "caregiver",
      homePlace: "Lagos",
      personalityTraits: ["warm_caring"],
      memoryTreasures: ["family_gatherings"],
      sharingIntent: "shared_legacy",
    });

    renderWithProviders(
      <Routes>
        <Route path="/onboarding/summary" element={<SummaryPage />} />
        <Route path="/chat" element={<ChatLocationEcho />} />
      </Routes>,
      { route: "/onboarding/summary", auth: true },
    );

    await user.click(await screen.findByRole("button", { name: /talk with memento/i }));
    expect(await screen.findByText(/hi memento, it's jane\./i)).toBeInTheDocument();
    expect(screen.getByText(/family gatherings/i)).toBeInTheDocument();
    expect(sessionStorage.getItem(ONBOARDING_SUMMARY_STORAGE_KEY)).toBeNull();
  });
});

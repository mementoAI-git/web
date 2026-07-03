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

function OverviewLocationEcho() {
  const location = useLocation();
  return <div>{String(location.state?.openModal ?? "none")}</div>;
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

    expect(await screen.findAllByText(/enrichment score/i)).toHaveLength(2);
    expect(
      screen.getByRole("heading", {
        name: /your memento profile is shaping up/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/a first outline is already here\. you can keep building it at your own pace\./i),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Identity & Self").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Heritage & Roots").length).toBeGreaterThan(0);
    expect(
      screen.getByText(/so far, your story is already opening around who you are/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/still quiet for now:/i),
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

    const dashboardButtons = await screen.findAllByRole("button", {
      name: /go to dashboard/i,
    });
    await user.click(dashboardButtons[0]);
    expect(await screen.findByText("Overview route")).toBeInTheDocument();
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

    const chatButtons = await screen.findAllByRole("button", { name: /chat/i });
    await user.click(chatButtons[0]);
    expect(await screen.findByText(/hi memento, it's jane\./i)).toBeInTheDocument();
    expect(screen.getByText(/family gatherings/i)).toBeInTheDocument();
    expect(sessionStorage.getItem(ONBOARDING_SUMMARY_STORAGE_KEY)).toBeNull();
  });

  it("opens the add story modal from the banner card and clears the snapshot", async () => {
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
        <Route path="/overview" element={<OverviewLocationEcho />} />
      </Routes>,
      { route: "/onboarding/summary", auth: true },
    );

    const addStoryButtons = await screen.findAllByRole("button", { name: /add a story/i });
    await user.click(addStoryButtons[0]);
    expect(await screen.findByText("create-memory")).toBeInTheDocument();
    expect(sessionStorage.getItem(ONBOARDING_SUMMARY_STORAGE_KEY)).toBeNull();
  });
});

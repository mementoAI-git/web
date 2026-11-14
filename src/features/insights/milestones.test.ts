import { describe, expect, it } from "vitest";
import { calculateMilestones, orderMilestones } from "./milestones";

const onboarding = (complete: boolean) =>
  calculateMilestones({ onboardingComplete: complete }).find((m) => m.id === "onboarding")!;

describe("Complete onboarding milestone", () => {
  it("links to onboarding until it is finished", () => {
    expect(onboarding(false)).toMatchObject({ achieved: false, progressLabel: "Start", href: "/onboarding" });
  });

  it("unlocks and drops the link once onboarding is completed", () => {
    expect(onboarding(true)).toMatchObject({ achieved: true, progressLabel: "Unlocked" });
    expect(onboarding(true).href).toBeUndefined();
  });

  it("leads the list while unfinished, ahead of goals already in progress", () => {
    const ordered = orderMilestones(calculateMilestones({ onboardingComplete: false, memoryCount: 5 }));
    expect(ordered[0].id).toBe("onboarding");
    expect(ordered[1].id).toBe("stories-ten");
  });
});

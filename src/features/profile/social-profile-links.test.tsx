import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SocialProfileLinks } from "./social-profile-links";
import { normalizeSocialProfileUrl } from "./social-accounts";

describe("SocialProfileLinks", () => {
  it("normalizes Instagram profiles and rejects non-profile or unsafe URLs", () => {
    expect(
      normalizeSocialProfileUrl(
        "instagram",
        "https://instagram.com/my.profile/?utm_source=share",
      ),
    ).toBe("https://www.instagram.com/my.profile");
    for (const url of [
      "https://instagram.com/p/123",
      "https://instagram.com/reels",
      "https://instagram.com/accounts",
      "https://instagram.com.evil.test/me",
      "http://instagram.com/me",
    ]) {
      expect(normalizeSocialProfileUrl("instagram", url)).toBeNull();
    }
  });
  it("hides absent and explicitly removed accounts", () => {
    render(<SocialProfileLinks accounts={{ x: null }} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
  it("renders only safe saved accounts using all five MingCute brand icons", () => {
    render(
      <SocialProfileLinks
        accounts={{
          bluesky: {
            url: "https://bsky.app/profile/me.bsky.social",
            source: "user",
            confirmed_at: "",
          },
          x: { url: "https://x.com/me", source: "ai", confirmed_at: "" },
          youtube: {
            url: "https://youtube.com/@me",
            source: "user",
            confirmed_at: "",
          },
          linkedin: {
            url: "https://linkedin.com/in/me",
            source: "user",
            confirmed_at: "",
          },
          facebook: {
            url: "https://facebook.com/me",
            source: "ai",
            confirmed_at: "",
          },
        }}
      />,
    );
    expect(
      screen.getAllByRole("link").map((x) => x.getAttribute("aria-label")),
    ).toEqual([
      "Bluesky profile",
      "X profile",
      "YouTube profile",
      "LinkedIn profile",
      "Facebook profile",
    ]);
    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link.querySelector("svg")).toBeTruthy();
    }
  });
  it("hides unsafe stored URLs and rejects posts rather than profiles", () => {
    render(
      <SocialProfileLinks
        accounts={{
          x: {
            url: "https://x.com.evil.test/me",
            source: "ai",
            confirmed_at: "",
          },
        }}
      />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(
      normalizeSocialProfileUrl("youtube", "https://youtube.com/watch?v=123"),
    ).toBeNull();
  });
});

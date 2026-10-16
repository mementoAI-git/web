import { describe, expect, it } from "vitest";
import { getProfileAvatarUrl } from "./profile-avatar";

describe("getProfileAvatarUrl", () => {
  it("uses the resolved profile photo URL", () => {
    expect(getProfileAvatarUrl({ picture_url: "https://api.example.com/files/photo.jpg", picture: "photo.jpg" })).toBe("https://api.example.com/files/photo.jpg");
  });
  it("leaves a stored filename to the generated avatar fallback", () => {
    expect(getProfileAvatarUrl({ picture: "img_1221_260826084057.jpg" })).toBeUndefined();
  });
  it("preserves legacy profiles with a full photo URL", () => {
    expect(getProfileAvatarUrl({ picture: "https://example.com/photo.jpg" })).toBe("https://example.com/photo.jpg");
  });
  it.each([undefined, "", "null", "undefined"])("handles a missing photo URL: %s", (picture_url) => {
    expect(getProfileAvatarUrl({ picture_url })).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";
import { getAvatarSeed, getAvatarSourceUrl, getGeneratedAvatarUrl } from "./avatar-identity";

describe("person avatar identity", () => {
  it("keeps a registered person's avatar across different names and email changes", () => {
    const account = {
      userId: " User-123 ",
      email: "first@example.com",
      name: "Sam Smith",
    };
    expect(getGeneratedAvatarUrl(account)).toBe(
      "https://api.dicebear.com/10.x/loops/svg?seed=user-123",
    );
    expect(
      getGeneratedAvatarUrl({
        ...account,
        email: "new@example.com",
        name: "Samuel",
      }),
    ).toBe(getGeneratedAvatarUrl(account));
    expect(getGeneratedAvatarUrl({ userId: "user-123" })).toBe(
      getGeneratedAvatarUrl(account),
    );
  });
  it("normalizes pending invitation email and ignores blank identity fields", () => {
    expect(
      getAvatarSeed({ userId: " ", email: " SAM@example.com ", name: "Sam" }),
    ).toBe("sam@example.com");
    expect(getAvatarSeed({ email: " ", name: " Sam Smith " })).toBe(
      "sam smith",
    );
    expect(getGeneratedAvatarUrl({})).toBeUndefined();
  });
});

describe("stored avatar sources", () => {
  it("migrates a generated avatar even when account details are unavailable", () => {
    expect(getAvatarSourceUrl("https://api.dicebear.com/9.x/avataaars/svg?seed=Sam", {})).toBe("https://api.dicebear.com/10.x/loops/svg?seed=sam");
  });
  it.each(["/photo.jpg", "blob:upload-preview", "https://photos.example.com/avatar.jpg"])("preserves uploaded photo source %s", (src) => {
    expect(getAvatarSourceUrl(src, {userId: "sam"})).toBe(src);
  });
  it("ignores blank photo sources", () => {
    expect(getAvatarSourceUrl(" ", {userId: "sam"})).toBeUndefined();
  });
});

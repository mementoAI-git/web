import { authRedirect } from "./auth-redirect";
it.each([null, "https://other.test", "//other.test", "/\\other.test", "/login?redirect=/login", "/\nother.test"])("rejects unsafe or looping return path %s", value => {
  expect(authRedirect(value)).toBe("/overview");
});
it("preserves already decoded internal paths including literal percent and hash", () => {
  expect(authRedirect("/stories?search=50%#saved")).toBe("/stories?search=50%#saved");
});

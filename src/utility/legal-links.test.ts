import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PRIVACY_URL, TERMS_URL } from "./legal-links";

const read = (file: string) => readFileSync(join(process.cwd(), "src", file), "utf8");

// The web app has no /terms or /privacy route, so the legal text links to the
// published pages on the marketing site.
describe("legal links", () => {
  it("point at the published legal pages", () => {
    expect(TERMS_URL).toBe("https://www.mymemento.io/legal-pages/terms-of-service/");
    expect(PRIVACY_URL).toBe("https://www.mymemento.io/legal-pages/privacy/");
  });

  for (const file of ["pages/auth/register/index.tsx", "components/modal/settings/privacy/index.tsx"]) {
    it(`${file} links both pages`, () => {
      const source = read(file);
      expect(source).toContain("href={TERMS_URL}");
      expect(source).toContain("href={PRIVACY_URL}");
    });
  }
});

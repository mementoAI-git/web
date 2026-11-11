import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

const read = (name: string) =>
  JSON.parse(readFileSync(join(__dirname, "../public/.well-known", name), "utf8"));

describe("app association files", () => {
  it("lets the Android app use this site's passkeys and open its links", () => {
    // Android checks this file before it offers a passkey for this domain or
    // opens /accept-invite links in the app. One malformed entry turns both off.
    const [entry] = read("assetlinks.json");
    expect(entry.target).toMatchObject({ namespace: "android_app", package_name: "io.mymemento.app" });
    expect(entry.relation).toEqual(
      expect.arrayContaining([
        "delegate_permission/common.get_login_creds",
        "delegate_permission/common.handle_all_urls",
      ]),
    );
    expect(entry.target.sha256_cert_fingerprints.length).toBeGreaterThan(0);
    for (const fingerprint of entry.target.sha256_cert_fingerprints) {
      expect(fingerprint).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
    }
  });

  it("lets the iOS app use this site's passkeys", () => {
    expect(read("apple-app-site-association").webcredentials.apps).toContain("LKYKU36B7W.io.mymemento.app");
  });
});

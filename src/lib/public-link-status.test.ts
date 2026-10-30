import { describe, expect, it } from "vitest";
import { isUnavailablePublicLink } from "./public-link-status";

describe("public link failures", () => {
  it.each([400, 401, 403, 404, 410, 422])("recognizes rejected links (%s)", status => {
    expect(isUnavailablePublicLink({ httpStatus: status })).toBe(true);
    expect(isUnavailablePublicLink({ status })).toBe(true);
  });
  it.each([undefined, new Error("offline"), { httpStatus: 429 }, { httpStatus: 500 }, { httpStatus: 503 }])("allows retry for transient failures %s", error => {
    expect(isUnavailablePublicLink(error)).toBe(false);
  });
});

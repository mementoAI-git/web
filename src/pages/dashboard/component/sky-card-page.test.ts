import { describe, expect, it } from "vitest";
import { isSkyCardPage } from "./sky-card-page";

describe("sky card page scope", () => {
  it.each(["/", "/overview", "/chat", "/chat/new", "/chat/thread/voice", "/explore", "/explore/categories/identity", "/settings/general", "/settings/security", "/settings/privacy", "/settings/billing", "/pricing"])(
    "includes %s", (pathname) => expect(isSkyCardPage(pathname)).toBe(true),
  );

  it.each(["/stories", "/stories/memory", "/insights", "/people", "/beneficiaries", "/settings/beneficiary", "/settings/beneficiary/groups", "/chatty", "/settings-other"])(
    "leaves %s unchanged", (pathname) => expect(isSkyCardPage(pathname)).toBe(false),
  );
});

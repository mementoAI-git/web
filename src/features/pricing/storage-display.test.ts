import { describe, expect, it } from "vitest";
import {
  formatStorageSummary,
  FREE_LIMIT_BYTES,
  PRO_LIMIT_BYTES,
} from "./storage-display";

describe("formatStorageSummary", () => {
  it("uses the billing usage and per-user quota ahead of legacy statistics", () => {
    expect(
      formatStorageSummary(
        {
          storage_used_bytes: 50 * 1024 ** 2,
          storage_limit_bytes: 500 * 1024 ** 2,
        },
        false,
        "0/1GB",
      ),
    ).toBe("50 MB / 500 MB");
  });
  it("uses Free and Pro plan defaults only when billing omits the quota", () => {
    expect(FREE_LIMIT_BYTES).toBe(200 * 1024 ** 2);
    expect(PRO_LIMIT_BYTES).toBe(10 * 1024 ** 3);
    expect(formatStorageSummary({ storage_used_bytes: 0 }, false)).toBe(
      "0 B / 200 MB",
    );
    expect(formatStorageSummary({ storage_used_bytes: 0 }, true)).toBe(
      "0 B / 10.0 GB",
    );
  });
  it("retains legacy used space without retaining its obsolete allowance", () => {
    expect(formatStorageSummary(undefined, false, "0/1GB")).toBe(
      "0 B / 200 MB",
    );
    expect(formatStorageSummary(undefined, true, "199MB/10.0GB")).toBe(
      "199 MB / 10.0 GB",
    );
    expect(formatStorageSummary(undefined, true, "1.2/5GB")).toBe(
      "1.2 GB / 10.0 GB",
    );
  });
  it("does not invent zero usage when it is unavailable", () => {
    expect(formatStorageSummary(undefined, false)).toBe("— / 200 MB");
    expect(formatStorageSummary(undefined, false, "unavailable")).toBe(
      "— / 200 MB",
    );
  });
});

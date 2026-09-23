import { describe, expect, it } from "vitest";
import { getMementoClientHeaders } from "./client-metadata";

describe("web API client metadata", () => {
  it("identifies every request as a bounded web build", () => {
    const headers = getMementoClientHeaders();

    expect(headers["X-Memento-Client"]).toBe("web");
    expect(headers["X-Memento-Version"]).toMatch(/^.{1,128}$/);
    expect(headers["X-Memento-Build"]).toMatch(/^.{1,128}$/);
  });
});

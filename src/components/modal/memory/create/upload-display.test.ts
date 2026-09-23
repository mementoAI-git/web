import { describe, expect, it } from "vitest";
import { getUploadDisplayKind } from "./upload-display";

describe("getUploadDisplayKind", () => {
  it("classifies documents into the attachment rail", () => {
    expect(getUploadDisplayKind("application/pdf")).toBe("document");
    expect(getUploadDisplayKind("application/msword")).toBe("document");
    expect(
      getUploadDisplayKind("application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    ).toBe("document");
    expect(getUploadDisplayKind("text/plain")).toBe("document");
  });

  it("classifies rich media into the main composer area", () => {
    expect(getUploadDisplayKind("image/png")).toBe("media");
    expect(getUploadDisplayKind("video/mp4")).toBe("media");
    expect(getUploadDisplayKind("audio/webm")).toBe("media");
    expect(getUploadDisplayKind("audio/mpeg")).toBe("media");
  });
});

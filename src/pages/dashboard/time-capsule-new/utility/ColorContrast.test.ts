import { describe, it, expect } from "vitest";
import { getContrastColor, getBorderColor } from "./ColorContrast";

describe("getContrastColor", () => {
  it("returns #000000 for white (#FFFFFF)", () => {
    expect(getContrastColor("#FFFFFF")).toBe("#000000");
  });

  it("returns #FFFFFF for black (#000000)", () => {
    expect(getContrastColor("#000000")).toBe("#FFFFFF");
  });

  it("returns #000000 for mid-gray (luminance > 0.5)", () => {
    expect(getContrastColor("#808080")).toBe("#000000");
  });

  it("returns #000000 for bright yellow", () => {
    expect(getContrastColor("#FFFF00")).toBe("#000000");
  });

  it("returns #FFFFFF for dark blue", () => {
    expect(getContrastColor("#000080")).toBe("#FFFFFF");
  });

  it("handles hex without # prefix", () => {
    expect(getContrastColor("FFFFFF")).toBe("#000000");
    expect(getContrastColor("000000")).toBe("#FFFFFF");
  });
});

describe("getBorderColor", () => {
  it("returns rgba(0, 0, 0, 0.1) for light backgrounds (contrast is black)", () => {
    expect(getBorderColor("#FFFFFF")).toBe("rgba(0, 0, 0, 0.1)");
    expect(getBorderColor("#FFFF00")).toBe("rgba(0, 0, 0, 0.1)");
  });

  it("returns rgba(255, 255, 255, 0.2) for dark backgrounds (contrast is white)", () => {
    expect(getBorderColor("#000000")).toBe("rgba(255, 255, 255, 0.2)");
    expect(getBorderColor("#000080")).toBe("rgba(255, 255, 255, 0.2)");
  });
});

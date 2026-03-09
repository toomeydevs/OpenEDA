import { describe, it, expect } from "vitest";
import { hexToRgb } from "@/lib/utils";

describe("hexToRgb", () => {
  it("converts the default theme color correctly", () => {
    expect(hexToRgb("#2962A8")).toEqual([41, 98, 168]);
  });

  it("converts a custom hex color correctly", () => {
    expect(hexToRgb("#FF5733")).toEqual([255, 87, 51]);
  });

  it("handles lowercase hex strings", () => {
    expect(hexToRgb("#ff5733")).toEqual([255, 87, 51]);
  });

  it("handles hex without leading #", () => {
    expect(hexToRgb("2962A8")).toEqual([41, 98, 168]);
  });

  it("falls back to the default blue for invalid input", () => {
    expect(hexToRgb("not-a-color")).toEqual([41, 98, 168]);
  });

  it("converts black correctly", () => {
    expect(hexToRgb("#000000")).toEqual([0, 0, 0]);
  });

  it("converts white correctly", () => {
    expect(hexToRgb("#FFFFFF")).toEqual([255, 255, 255]);
  });
});

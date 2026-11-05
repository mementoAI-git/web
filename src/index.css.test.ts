import { readFileSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

const stylesheet = postcss.parse(
  readFileSync(resolve(process.cwd(), "src/index.css"), "utf8"),
);

function declaration(selector: string, property: string) {
  let value: string | undefined;
  stylesheet.walkRules((rule) => {
    if (rule.selector !== selector) return;
    rule.walkDecls(property, (entry) => {
      value = entry.value;
    });
  });
  return value;
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return [".ts", ".tsx", ".css"].some((extension) =>
      entry.name.endsWith(extension),
    )
      ? [path]
      : [];
  });
}

describe("dark color token compatibility", () => {
  it("uses the approved brand orange throughout the semantic scale", () => {
    expect(declaration(":root", "--orange-1000")).toBe("#e98246");
    expect(declaration(":root", "--orange-800")).toBe(
      "rgba(233, 130, 70, 0.8)",
    );
    expect(declaration(":root", "--orange-200")).toBe(
      "rgba(233, 130, 70, 0.2)",
    );
    expect(declaration(":root", "--orange-50")).toBe(
      "rgba(233, 130, 70, 0.05)",
    );
  });

  it("defines the primary button surface gradient from 34% to transparent", () => {
    const gradient = declaration(":root", "--gradient-brand-button-surface");

    expect(gradient).toContain("radial-gradient(");
    expect(gradient).toContain("ellipse 100% 100% at 50% 0%");
    expect(gradient).toContain("rgba(255, 255, 255, 0.34) 0%");
    expect(gradient).toContain("rgba(255, 255, 255, 0) 100%");
  });

  it("does not hard-code the retired brand orange in the interface", () => {
    const retiredBrandOrange = /#ff5e00|rgba\(255,\s*94,\s*0/iu;
    const legacyUses = sourceFiles(resolve(process.cwd(), "src"))
      .filter((path) => !path.includes(".test."))
      .filter((path) => retiredBrandOrange.test(readFileSync(path, "utf8")))
      .map((path) => relative(process.cwd(), path));

    expect(legacyUses).toEqual([]);
  });

  it("uses a pure white page canvas in light mode", () => {
    expect(declaration(":root", "--color-background")).toBe("#ffffff");
    expect(declaration(":root", "--background")).toBe("#ffffff");
  });

  it("uses the approved six-percent fill weak color in light mode", () => {
    expect(declaration(":root", "--fill-neutral-weak")).toBe(
      "rgba(15, 7, 0, 0.06)",
    );
  });

  it("keeps the dark canvas distinct from raised floating surfaces", () => {
    expect(declaration(".dark", "--color-background")).toBe("#12131a");
    expect(declaration(".dark", "--bg-neutral")).toBe("var(--bg-neutral-solid)");
    expect(declaration(".dark", "--bg-neutral-solid")).toBe("#12131a");
    expect(declaration(".dark", "--v3-bg")).toBe("#12131a");
    expect(declaration(".dark", "--background")).toBe("#12131a");
    expect(declaration(".dark", "--card")).toBe("var(--background)");
    expect(declaration(".dark", "--popover")).toBe("var(--bg-raised)");
  });

  it.each([":root", ".dark", ".deep-sky", ".light-sky"])(
    "uses the raised popover fill in %s",
    (theme) => {
      expect(declaration(theme, "--popover")).toBe("var(--bg-raised)");
    },
  );

  it("switches status intent primitives to their dark-mode palette", () => {
    expect(declaration(".dark", "--red-1000")).toBe("#ff9c9c");
    expect(declaration(".dark", "--amber-1000")).toBe("#e0be70");
    expect(declaration(".dark", "--green-1000")).toBe("#77c7af");
    expect(declaration(".dark", "--blue-1000")).toBe("#52a1dd");
    expect(declaration(":root", "--destructive")).toBe(
      "var(--text-error-strong)",
    );
  });

  it("keeps auth and onboarding UI on semantic color tokens", () => {
    const scopedPaths = [
      "src/pages/auth",
      "src/pages/onboarding",
      "src/pages/onboard-chat",
      "src/features/onboarding-groot",
    ];
    const scopedFiles = scopedPaths.flatMap((path) =>
      sourceFiles(resolve(process.cwd(), path)),
    );
    scopedFiles.push(
      resolve(process.cwd(), "src/components/auth-split-layout.tsx"),
      resolve(process.cwd(), "src/components/auth-loader.tsx"),
      resolve(process.cwd(), "src/components/Form/password-input.tsx"),
    );

    const rawColor =
      /#[0-9a-f]{3,8}\b|\b(?:bg|text|border|ring|fill|stroke)-(?:white|black|slate|gray|zinc|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-[0-9]{1,3})?(?:\/[0-9]+)?\b/iu;
    const violations = scopedFiles
      .filter((path) => !path.includes(".test."))
      .filter((path) => rawColor.test(readFileSync(path, "utf8")))
      .map((path) => relative(process.cwd(), path));

    expect(violations).toEqual([]);
  });

  it("scopes dark utilities to the selected class", () => {
    const darkVariant = stylesheet.nodes.find(
      (node) =>
        node.type === "atrule" &&
        node.name === "custom-variant" &&
        node.params === "dark (&:where(.dark, .dark *))",
    );
    expect(darkVariant).toBeDefined();
  });

  it("keeps secondary surfaces separate from the body foreground", () => {
    expect(declaration(".dark", "--color-secondary")).toBe("var(--secondary)");
    expect(declaration(".dark", "--secondary")).toBe(
      "var(--fill-neutral-weak)",
    );
    expect(declaration("body", "color")).toBe("var(--foreground)");
  });

  it("keeps legacy strong-fill controls readable with white labels", () => {
    expect(declaration(".dark", "--fill-neutral-strong")).toBe(
      "var(--brown-1000)",
    );
    expect(declaration(":root", "--v3-fill-strong")).toBe(
      "var(--fill-neutral-strong)",
    );
  });

  it("does not use the secondary surface token as a text utility", () => {
    const legacyTextUtility = new RegExp(
      `(?<![A-Za-z0-9-])${"text"}-secondary(?![A-Za-z0-9-])`,
    );
    const legacyUses = sourceFiles(resolve(process.cwd(), "src"))
      .filter((path) => legacyTextUtility.test(readFileSync(path, "utf8")))
      .map((path) => relative(process.cwd(), path));

    expect(legacyUses).toEqual([]);
  });

  it("uses a semantic indicator token for volume slider thumbs", () => {
    expect(
      declaration(".volume__slider::-webkit-slider-thumb", "background"),
    ).toBe("var(--icon-neutral-strong)");
    expect(declaration(".volume__slider::-moz-range-thumb", "background")).toBe(
      "var(--icon-neutral-strong)",
    );
  });

  it("uses the semantic indicator token for the volume slider track", () => {
    const audioPlayer = readFileSync(
      resolve(process.cwd(), "src/components/player/audio-player.tsx"),
      "utf8",
    );
    const sliderStart = audioPlayer.indexOf('className="volume__slider');
    expect(sliderStart).toBeGreaterThan(-1);

    const sliderEnd = audioPlayer.indexOf("/>", sliderStart);
    expect(sliderEnd).toBeGreaterThan(sliderStart);
    const sliderMarkup = audioPlayer.slice(sliderStart, sliderEnd);
    expect(sliderMarkup).toContain("var(--icon-neutral-strong)");
    expect(sliderMarkup).not.toContain("var(--color-secondary)");
  });
});

describe("desktop Add Story typography", () => {
  it("uses single-spaced paragraph breaks in the journal editor", () => {
    expect(
      declaration(
        ".add-story-journal .tiptap-editor--memory-next .ProseMirror p",
        "margin",
      ),
    ).toBe("0");
  });
});

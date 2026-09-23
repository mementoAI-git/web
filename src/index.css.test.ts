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

  it("does not consume the secondary surface token as an indicator", () => {
    const secondaryReference = `var(--color-${"secondary"})`;
    const legacyConsumers = sourceFiles(resolve(process.cwd(), "src")).flatMap(
      (path) => {
        const source = readFileSync(path, "utf8");
        if (!path.endsWith(".css")) {
          return source.includes(secondaryReference)
            ? [relative(process.cwd(), path)]
            : [];
        }

        const consumers: string[] = [];
        postcss.parse(source).walkDecls((entry) => {
          if (
            entry.prop !== "--color-secondary" &&
            entry.value.includes(secondaryReference)
          ) {
            consumers.push(
              `${relative(process.cwd(), path)}:${entry.source?.start?.line}`,
            );
          }
        });
        return consumers;
      },
    );

    expect(legacyConsumers).toEqual([]);
  });
});

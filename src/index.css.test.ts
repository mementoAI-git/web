import { readFileSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

const stylesheet = postcss.parse(
  readFileSync(resolve(process.cwd(), "src/index.css"), "utf8"),
);

function declaration(selector: string, property: string) {
  const rule = stylesheet.nodes.find(
    (node) => node.type === "rule" && node.selector === selector,
  );
  const declarations = rule?.nodes.filter(
    (node) => node.type === "decl" && node.prop === property,
  );
  return declarations?.at(-1)?.value;
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")
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
});

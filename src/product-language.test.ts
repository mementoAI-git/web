import { readFileSync, readdirSync, statSync } from "fs";
import * as path from "path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

// Memento's product language (AGENTS.md): "connection", never "beneficiary";
// "your Memento", never an "AI twin" or "digital twin". This scans the copy
// people see: string literals and JSX text. Code names such as endpoints,
// props and `beneficiaryIds` are not prose and are left alone.
const OLD_TERMS = /beneficiar|\btwin\b/i;

const EXCLUDED = ["src/test", "src/dev", "src/stories"];

const STOPWORDS = new Set([
  "a", "an", "the", "their", "your", "them", "they", "it", "is", "as", "to",
  "of", "or", "and", "with", "which", "who", "not", "yet", "no", "for", "on",
]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    const relative = path.relative(process.cwd(), full);
    if (EXCLUDED.includes(relative)) return [];
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(full) && !/\.(test|spec|stories)\.tsx?$/.test(full) ? [full] : [];
  });
}

/** A field list like "groups beneficiaries visibility", not a sentence. */
function isFieldList(text: string): boolean {
  const words = text.trim().split(/\s+/);
  return words.every((w) => /^[a-z_][a-z0-9_.-]*$/.test(w)) && !words.some((w) => STOPWORDS.has(w));
}

/** Prose with identifiers like `beneficiaryIds` or `add-beneficiary` taken out. */
function withoutIdentifiers(text: string): string {
  return text.replace(/\b[a-z]+[A-Z]\w*\b/g, "").replace(/\b[a-z]+(-[a-z]+)+\b/g, "");
}

/** Every string literal, template and JSX text in the file, without comments. */
function prose(file: string): string[] {
  const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const found: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) found.push(node.text);
    else if (ts.isTemplateExpression(node))
      found.push([node.head.text, ...node.templateSpans.map((s) => s.literal.text)].join(" "));
    else if (ts.isJsxText(node)) found.push(node.text);
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found.map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
}

describe("product language", () => {
  const files = sourceFiles(path.join(process.cwd(), "src"));

  it("covers the app source", () => {
    expect(files.length).toBeGreaterThan(300);
  });

  it.each(files.map((f) => path.relative(process.cwd(), f)))("keeps the old terms out of %s", (file) => {
    const offending = prose(path.join(process.cwd(), file)).filter(
      (t) => /\s/.test(t) && !isFieldList(t) && OLD_TERMS.test(withoutIdentifiers(t)),
    );
    expect(offending).toEqual([]);
  });

  it("still catches sentences and leaves code names alone", () => {
    expect(OLD_TERMS.test(withoutIdentifiers("Remove this beneficiary?"))).toBe(true);
    expect(OLD_TERMS.test(withoutIdentifiers("open the add-beneficiary modal"))).toBe(false);
    expect(isFieldList("groups beneficiaries visibility")).toBe(true);
    expect(isFieldList("you have no beneficiary")).toBe(false);
  });
});

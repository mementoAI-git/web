import type { EveDynamicToolPart } from "eve/react";
import { BookOpenIcon, ExternalLinkIcon } from "lucide-react";
import { z } from "zod";

const sourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  excerpt: z.string(),
  date: z.string().nullable(),
  url: z.string().nullable(),
  origin: z.enum(["sample", "memento"]),
});
const resultSchema = z.object({
  memories: z.array(sourceSchema).max(5),
  mode: z.enum(["sample", "memento"]),
});

/** Validates a memory tool result before displaying its sources.
 * @param output - The untrusted result received from the agent tool.
 * @returns Validated sources or null when the result is malformed.
 */
export function memorySourcesFrom(output: EveDynamicToolPart["output"]) {
  const parsed = resultSchema.safeParse(output);
  return parsed.success ? parsed.data : null;
}

/** Displays memory excerpts and links with their collection identity.
 * @param props - The validated memory sources.
 * @returns Source cards or empty search feedback.
 */
export function MemorySources({
  sources,
}: {
  /** Validated memory excerpts returned by a search. */
  readonly sources: readonly z.infer<typeof sourceSchema>[];
}) {
  if (sources.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No matching memories found. Try a different phrase.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-3" aria-label="Memory sources">
      {sources.map((source) => {
        const sourceUrl = safeSourceUrl(source.url);
        const hasSourceUrl = sourceUrl !== null;
        const sourceDate =
          source.date === null ? "" : ` · ${source.date.slice(0, 10)}`;
        return (
          <li
            key={source.id}
            className="border-border flex flex-col gap-2 rounded-lg border p-4"
          >
            <div className="flex items-start gap-2">
              <BookOpenIcon
                aria-hidden="true"
                className="text-muted-foreground mt-0.5 size-4 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium">{source.title}</p>
                <p className="text-muted-foreground text-xs">
                  {source.origin === "sample"
                    ? "Fictional sample"
                    : "Your Memento memory"}
                  {sourceDate}
                </p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {source.excerpt}
            </p>
            {hasSourceUrl ? (
              <a
                className="text-primary inline-flex items-center gap-1 text-sm underline underline-offset-4"
                href={sourceUrl ?? undefined}
                target="_blank"
                rel="noreferrer"
              >
                Open in Memento
                <ExternalLinkIcon aria-hidden="true" className="size-3" />
              </a>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/** Accepts credential-free web links from validated source records.
 * @param value - The source URL supplied by the memory service.
 * @returns The normalized link or null when unsafe.
 */
function safeSourceUrl(value: string | null): string | null {
  if (value === null || value.length === 0) {
    return null;
  }
  try {
    const url = new URL(value);
    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      url.username.length > 0 ||
      url.password.length > 0
    ) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}

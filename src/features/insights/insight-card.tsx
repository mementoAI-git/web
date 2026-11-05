import { EnrichmentFieldIcon } from "./enrichment-field-icon";
import { getEnrichmentField } from "./enrichment-fields";
import type { Insight } from "./insights-api.types";

/** The icon is the field the insight leans toward most, which the API lists first. */
export function InsightCard({
  insight,
  onOpen,
}: {
  insight: Insight;
  onOpen: (insight: Insight) => void;
}) {
  const spansFields = insight.categories.length > 1;
  return (
    <article className="insights-card insights-insight">
      <EnrichmentFieldIcon
        field={insight.categories[0]}
        className="size-8"
      />
      <div className="min-w-0 flex-1">
        <h3 className="font-inter text-base text-text-neutral-strong">
          {insight.title}
        </h3>
        <p className="mt-2 font-inter text-sm text-text-neutral-weak">
          {insight.body}
        </p>
        {spansFields && (
          <p className="mt-2 font-inter text-xs text-text-neutral-weaker">
            {insight.categories
              .map((category) => getEnrichmentField(category).label)
              .join(" · ")}
          </p>
        )}
        <button
          type="button"
          className="insights-link mt-2"
          aria-label={`See related stories for ${insight.title}`}
          onClick={() => onOpen(insight)}
        >
          See related stories
        </button>
      </div>
    </article>
  );
}

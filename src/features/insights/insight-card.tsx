import { EnrichmentFieldIcon } from "./enrichment-field-icon";
import type { Insight } from "./insights-api.types";

/** The icon is the field the insight leans toward most, which the API lists first. */
export function InsightCard({
  insight,
  onOpen,
}: {
  insight: Insight;
  onOpen: (insight: Insight) => void;
}) {
  return (
    <article
      className="insights-card insights-insight"
      onClick={() => onOpen(insight)}
    >
      <EnrichmentFieldIcon
        field={insight.categories[0]}
        className="size-8"
      />
      <div className="min-w-0 flex-1">
        <h3 className="font-inter text-base text-text-neutral-strong">
          {/* The card handles clicks; this is its keyboard and screen reader control. */}
          <button type="button" className="insights-insight-open">
            {insight.title}
          </button>
        </h3>
        <p className="mt-2 line-clamp-2 font-inter text-sm text-text-neutral-weak">
          {insight.body}
        </p>
      </div>
    </article>
  );
}

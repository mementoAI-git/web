import { useState, type CSSProperties } from "react";
import dayjs from "dayjs";
import { ChevronDown, CircleHelp, Sparkles, Undo2 } from "lucide-react";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { EnrichmentCategory } from "@/features/enrichment/enrichment-categories";
import { EnrichmentFieldIcon } from "./enrichment-field-icon";
import { enrichmentFieldColor, getEnrichmentField } from "./enrichment-fields";
import { InsightCard } from "./insight-card";
import type {
  Insight,
  InsightSource,
  InsightSourceList,
} from "./insights-api.types";
import { useInsights } from "./use-insights";

type SortOrder = "newest" | "oldest";
const SORT_LABELS: Record<SortOrder, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
};

function sortSources(sources: InsightSource[], order: SortOrder) {
  const direction = order === "newest" ? -1 : 1;
  return [...sources].sort(
    (a, b) =>
      direction *
      (dayjs(a.created_at ?? 0).valueOf() - dayjs(b.created_at ?? 0).valueOf()),
  );
}

/** Italicizes the last word of a heading, matching the overlay's title style. */
function FieldHeading({ label }: { label: string }) {
  const split = label.lastIndexOf(" ");
  if (split < 0) return <em>{label}</em>;
  return (
    <>
      {label.slice(0, split)} <em>{label.slice(split + 1)}</em>
    </>
  );
}

function SourcesTable({
  sourcesKey,
  query,
  empty,
  onView,
}: {
  sourcesKey: string;
  query: string;
  empty: string;
  onView: (source: InsightSource) => void;
}) {
  const [order, setOrder] = useState<SortOrder>("newest");
  const { data, error, isLoading, mutate } = useSWR<{
    data: InsightSourceList;
  }>(sourcesKey);
  const all = data?.data?.sources ?? [];
  const needle = query.trim().toLowerCase();
  const sources = sortSources(
    all.filter((source) => source.title.toLowerCase().includes(needle)),
    order,
  );

  if (error && !data)
    return (
      <div className="insights-empty">
        <p>Couldn’t load these memories.</p>
        <Button variant="outline" onClick={() => void mutate()}>
          Retry memories
        </Button>
      </div>
    );
  if (isLoading && !data)
    return (
      <div className="insights-empty" role="status">
        <Spinner />
        Loading memories…
      </div>
    );
  return (
    <section aria-label="Memory sources" className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-inter text-base font-medium text-text-neutral-strong">
          {all.length} Memory {all.length === 1 ? "source" : "sources"}
        </h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="insights-action"
              aria-label="Sort memory sources"
            >
              {SORT_LABELS[order]}
              <ChevronDown aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-[120]">
            {(Object.keys(SORT_LABELS) as SortOrder[]).map((key) => (
              <DropdownMenuItem key={key} onSelect={() => setOrder(key)}>
                {SORT_LABELS[key]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {!sources.length ? (
        <div className="insights-empty">
          <p>{all.length ? "No matching memories." : empty}</p>
        </div>
      ) : (
        <div className="insights-table" role="table" aria-label="Memory sources">
          <div className="insights-table-head insights-sources-row" role="row">
            <span role="columnheader">Topic</span>
            <span role="columnheader" className="flex items-center gap-1.5">
              Date created
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label="About date created">
                    <CircleHelp className="size-4" aria-hidden />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="z-[120]">
                  When this memory was first saved
                </TooltipContent>
              </Tooltip>
            </span>
            <span role="columnheader" className="sr-only">
              Action
            </span>
          </div>
          {sources.map((source) => (
            <div key={source.id} className="insights-sources-row" role="row">
              <div className="flex min-w-0 items-center gap-3" role="cell">
                {source.thumbnail ? (
                  <img
                    src={source.thumbnail}
                    alt=""
                    loading="lazy"
                    className="insights-thumbnail object-cover"
                  />
                ) : (
                  <span className="insights-thumbnail" aria-hidden />
                )}
                <span className="truncate font-inter text-sm font-medium text-text-neutral-strong">
                  {source.title}
                </span>
              </div>
              <span
                className="font-inter text-sm text-text-neutral-weak"
                role="cell"
              >
                {source.created_at
                  ? dayjs(source.created_at).format("D MMM, YYYY")
                  : "—"}
              </span>
              <div role="cell">
                <Button
                  variant="outline"
                  className="insights-action"
                  aria-label={`View ${source.title}`}
                  onClick={() => onView(source)}
                >
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function DetailFrame({
  categories,
  subtitle,
  note,
  onBack,
  action,
  children,
}: {
  categories: EnrichmentCategory[];
  subtitle: string;
  note: React.ReactNode;
  onBack: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const fields = categories.map(getEnrichmentField);
  const heroLabel = fields.map((field) => field.label).join(" · ");
  return (
    <div className="flex flex-col gap-4">
      <div className="insights-page-heading">
        <Button
          variant="ghost"
          size="icon-lg"
          className="insights-round-button"
          aria-label="Back to insights"
          onClick={onBack}
        >
          <Undo2 aria-hidden />
        </Button>
        <h2 className="min-w-0 font-garamond text-4xl text-text-neutral-strong">
          <FieldHeading label={fields[0]?.label ?? "Insight"} />
        </h2>
      </div>
      <div
        className="insights-hero"
        style={
          {
            "--field": enrichmentFieldColor(categories[0]),
          } as CSSProperties
        }
      >
        <EnrichmentFieldIcon field={categories[0]} className="size-10" />
        <div className="min-w-0 flex-1">
          <p className="font-inter text-xl font-semibold text-text-neutral-strong">
            {heroLabel}
          </p>
          <p className="mt-1 font-inter text-sm text-text-neutral-weak">
            {subtitle}
          </p>
        </div>
        {action}
      </div>
      <div className="insights-note">
        <Sparkles className="insights-note-icon size-6 shrink-0" aria-hidden />
        <div className="min-w-0 font-inter text-sm text-text-neutral-strong">
          {note}
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-6">{children}</div>
    </div>
  );
}

export function InsightDetail({
  insight,
  query,
  onBack,
  onView,
}: {
  insight: Insight;
  query: string;
  onBack: () => void;
  onView: (source: InsightSource) => void;
}) {
  return (
    <DetailFrame
      categories={insight.categories}
      subtitle="Memories that helped shape this insight"
      onBack={onBack}
      note={
        <>
          <p>{insight.title}</p>
          <p className="mt-1 text-text-neutral-weak">{insight.body}</p>
        </>
      }
    >
      <SourcesTable
        sourcesKey={`${endpoint.insightSources}?insight=${encodeURIComponent(insight.id)}`}
        query={query}
        empty="The memories behind this insight are no longer available."
        onView={onView}
      />
    </DetailFrame>
  );
}

/** One enrichment field: its current insights and every memory tagged with it. */
export function EnrichmentFieldDetail({
  field,
  query,
  onBack,
  onView,
  onOpenInsight,
  onReflect,
}: {
  field: EnrichmentCategory;
  query: string;
  onBack: () => void;
  onView: (source: InsightSource) => void;
  onOpenInsight: (insight: Insight) => void;
  onReflect: (field: EnrichmentCategory) => void;
}) {
  const { list } = useInsights();
  const related = (list?.insights ?? []).filter((insight) =>
    insight.categories.includes(field),
  );
  return (
    <DetailFrame
      categories={[field]}
      subtitle="Memories that shape this field"
      onBack={onBack}
      note={getEnrichmentField(field).description}
      action={
        <Button
          variant="outline"
          className="insights-action"
          onClick={() => onReflect(field)}
        >
          Reflect on this
        </Button>
      }
    >
      {related.length > 0 && (
        <section aria-label="Related insights" className="insights-list">
          {related.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onOpen={onOpenInsight}
            />
          ))}
        </section>
      )}
      <SourcesTable
        sourcesKey={`${endpoint.insightSources}?category=${field}`}
        query={query}
        empty="No memories here yet. Reflect on this field to start filling it in."
        onView={onView}
      />
    </DetailFrame>
  );
}

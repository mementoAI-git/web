import type { CSSProperties } from "react";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import { Button } from "@/components/ui/button";
import type { EnrichmentCategory } from "@/features/enrichment/enrichment-categories";
import type { UserStatsData } from "@/features/enrichment/enrichment-api.types";
import { EnrichmentFieldIcon } from "./enrichment-field-icon";
import { ENRICHMENT_FIELDS, enrichmentFieldColor } from "./enrichment-fields";

export function EnrichmentFieldsTable({
  query,
  onExplore,
}: {
  query: string;
  onExplore: (field: EnrichmentCategory) => void;
}) {
  const { data } = useSWR<{ data: UserStatsData }>(endpoint.userStats);
  const scores = new Map(
    data?.data?.category_scores?.map((score) => [score.key, score]),
  );
  const needle = query.trim().toLowerCase();
  const fields = ENRICHMENT_FIELDS.filter((field) =>
    `${field.label} ${field.description}`.toLowerCase().includes(needle),
  );
  if (!fields.length)
    return (
      <div className="insights-empty">
        <p className="text-text-neutral-strong">No matching fields</p>
        <p>Try another word or clear your search.</p>
      </div>
    );
  return (
    <div className="insights-table" role="table" aria-label="Enrichment fields">
      <div className="insights-table-head insights-fields-row" role="row">
        <span role="columnheader">Enrichment fields</span>
        <span role="columnheader">Score</span>
        <span role="columnheader">Action</span>
      </div>
      {fields.map((field) => {
        const score = scores.get(field.key);
        const value = Math.round(
          Math.min(100, Math.max(0, Number(score?.score) || 0)),
        );
        return (
          <div key={field.key} className="insights-fields-row" role="row">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4" role="cell">
              <EnrichmentFieldIcon field={field.key} className="size-9 shrink-0" />
              <div className="min-w-0">
                <p className="truncate font-inter text-sm font-medium text-text-neutral-strong">
                  {field.label}
                </p>
                <p className="mt-0.5 truncate font-inter text-xs text-text-neutral-weak">
                  {field.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3" role="cell">
              {score?.unlocked === false ? (
                <span className="font-inter text-xs text-text-neutral-weaker">
                  Unlocks soon
                </span>
              ) : (
                <>
                  <span className="w-9 font-inter text-sm font-medium text-text-neutral-strong tabular-nums">
                    {value}%
                  </span>
                  <span
                    role="progressbar"
                    aria-label={`${field.label} score`}
                    aria-valuenow={value}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="insights-meter"
                    style={
                      {
                        "--field": enrichmentFieldColor(field.key),
                        "--value": `${value}%`,
                      } as CSSProperties
                    }
                  />
                </>
              )}
            </div>
            <div role="cell">
              <Button
                variant="outline"
                className="insights-action"
                aria-label={`Explore ${field.label}`}
                onClick={() => onExplore(field.key)}
              >
                Explore
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

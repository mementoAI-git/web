import dayjs from "dayjs";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { InsightCard } from "./insight-card";
import type { Insight } from "./insights-api.types";
import { useInsights } from "./use-insights";

export function InsightsPanel({
  query,
  onOpen,
}: {
  query: string;
  onOpen: (insight: Insight) => void;
}) {
  const { list, error, isLoading, mutate } = useInsights();
  const needle = query.trim().toLowerCase();
  const insights = (list?.insights ?? []).filter((insight) =>
    `${insight.title} ${insight.body}`.toLowerCase().includes(needle),
  );

  if (error && !list)
    return (
      <div className="insights-empty">
        <p>Couldn’t load your insights.</p>
        <Button variant="outline" onClick={() => void mutate()}>
          Retry insights
        </Button>
      </div>
    );
  if (isLoading && !list)
    return (
      <div className="insights-empty" role="status">
        <Spinner />
        Loading your insights…
      </div>
    );
  if (!list?.insights.length)
    return (
      <div className="insights-empty" role={list?.generating ? "status" : undefined}>
        {list?.generating ? (
          <Spinner />
        ) : (
          <Sparkles className="size-8 text-icon-neutral-weak" aria-hidden />
        )}
        <p className="text-text-neutral-strong">
          {list?.generating
            ? "Connecting your memories…"
            : "Your insights are taking shape"}
        </p>
        <p>
          {list?.generating
            ? "Your first insights will appear here in a moment."
            : "Save a few more memories and Memento will start finding connections between them."}
        </p>
      </div>
    );
  if (!insights.length)
    return (
      <div className="insights-empty">
        <p className="text-text-neutral-strong">No matching insights</p>
        <p>Try another word or clear your search.</p>
      </div>
    );
  return (
    <div className="insights-list">
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} onOpen={onOpen} />
      ))}
      {list.next_refresh_at && (
        <p className="pt-2 text-center font-inter text-xs text-text-neutral-weaker">
          {list.generating
            ? "Fresh insights are on the way."
            : `Fresh insights around ${dayjs(list.next_refresh_at).format("D MMM")}, as Memento learns more connections.`}
        </p>
      )}
    </div>
  );
}

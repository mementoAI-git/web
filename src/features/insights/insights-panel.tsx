import dayjs from "dayjs";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { InsightCard } from "./insight-card";
import type { Insight } from "./insights-api.types";
import { useInsights } from "./use-insights";

export function InsightsPanel({
  onOpen,
}: {
  onOpen: (insight: Insight) => void;
}) {
  const { list, error, isLoading, mutate } = useInsights();
  const insights = list?.insights ?? [];

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
  if (!list?.insights.length) {
    const checked = Boolean(list?.generated_at);
    return (
      <div
        className="insights-empty"
        role={list?.generating ? "status" : undefined}
      >
        {list?.generating ? (
          <Spinner />
        ) : (
          <Sparkles className="size-8 text-icon-neutral-weak" aria-hidden />
        )}
        <p className="text-text-neutral-strong">
          {list?.generating
            ? "Looking across your memories…"
            : checked
              ? "Nothing stands out yet"
              : "Your insights are taking shape"}
        </p>
        <p>
          {list?.generating
            ? "This can take a moment."
            : checked
              ? `Memento shares a pattern once it shows up across several of your memories over time. It looks again around ${dayjs(list?.next_refresh_at).format("D MMM")}.`
              : "Keep saving memories and reflecting. Memento shares a pattern once it shows up across several of them."}
        </p>
      </div>
    );
  }
  return (
    <div className="insights-list">
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} onOpen={onOpen} />
      ))}
      {list.next_refresh_at && (
        <p className="pt-2 text-center font-inter text-xs text-text-neutral-weaker">
          {list.generating
            ? "Looking for anything new."
            : `Memento looks again around ${dayjs(list.next_refresh_at).format("D MMM")}.`}
        </p>
      )}
    </div>
  );
}

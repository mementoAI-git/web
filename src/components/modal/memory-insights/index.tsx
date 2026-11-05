import { useRef, useState } from "react";
import { Archive, MoreHorizontal, Search } from "lucide-react";
import useSWR from "swr";
import { toast } from "sonner";
import endpoint from "@/api/endpoint";
import { entityResponseFetcher } from "@/api/domain-fetchers";
import { useApi } from "@/hooks/use-api";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import { useRequestRecovery } from "@/hooks/use-request-recovery";
import type { IPersona, IUser } from "@/utility/interface";
import { DashboardHeader } from "@/pages/dashboard/component/dashboard-header";
import { MemoryStatistics } from "@/features/insights/memory-statistics";
import { InsightsOverlayNavigation } from "@/features/insights/insights-overlay-navigation";
import { normalizeObservationForDisplay } from "@/features/insights/observation-display";
import { useEnrichmentStats } from "@/features/enrichment/use-enrichment-stats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import "./insights.css";

/** Fields for category lists (persona + legacy context) */
type MemoryInsightSource = {
  important_notes?: string[];
  key_preferences?: string[];
  conversation_history_summary?: string;
  emotional_state_trends?: string[];
  goals_and_aspirations?: string[];
  self_description?: string;
  join_reasons?: string[];
  current_priority?: string | string[];
};

type MemoryInsightsSummaryDto = {
  summary: string | null;
  generated_at: string | null;
  cached: boolean;
};

function personaToInsightSource(persona: IPersona): MemoryInsightSource {
  return {
    important_notes: persona.important_notes,
    key_preferences: persona.key_preferences,
    conversation_history_summary: persona.conversation_history_summary,
    emotional_state_trends: persona.emotional_state_trends,
    goals_and_aspirations: persona.goals_and_aspirations,
    self_description: persona.self_description,
    current_priority: persona.current_priority,
    join_reasons: persona.join_reasons,
  };
}

function userContextToInsightSource(
  ctx: IUser["context"] | Record<string, unknown> | undefined,
): MemoryInsightSource {
  if (!ctx || typeof ctx !== "object") return {};
  const c = ctx as IUser["context"] & { current_priority?: string | string[] };
  return {
    important_notes: c.important_notes,
    key_preferences: c.key_preferences,
    conversation_history_summary: c.conversation_history_summary,
    emotional_state_trends: c.emotional_state_trends,
    goals_and_aspirations: c.goals_and_aspirations,
    self_description: c.self_description,
    current_priority: c.current_priority,
    join_reasons: c.join_reasons,
  };
}

const categories = [
  {
    key: "important_notes",
    label: "Observation",
    color: "text-icon-success-strong",
  },
  {
    key: "key_preferences",
    label: "Preference",
    color: "text-icon-warning-strong",
  },
  {
    key: "goals_and_aspirations",
    label: "Goal",
    color: "text-icon-brand-strong",
  },
  {
    key: "emotional_state_trends",
    label: "Emotion",
    color: "text-icon-info-strong",
  },
] as const;

export default function MemoryInsightsModal() {
  const { close } = useModal();
  const returnFocus = useRef(
    typeof document !== "undefined" &&
      document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  );
  const { user } = useStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const {
    data: personaRes,
    isLoading,
    error,
    mutate,
  } = useApi<IPersona | null>(endpoint.persona);
  const { data: contextData } = useSWR(
    endpoint.userContext,
    entityResponseFetcher,
  );
  const {
    data: summaryRes,
    isLoading: summaryLoading,
    error: summaryError,
    mutate: refreshSummary,
  } = useApi<MemoryInsightsSummaryDto>(endpoint.personaMemoryInsightsSummary);
  const retry = useRequestRecovery(
    "insights-persona",
    error,
    mutate,
    "Couldn’t load your insights. Please retry.",
  );
  const retrySummary = useRequestRecovery(
    "insights-summary",
    summaryError,
    refreshSummary,
    "Couldn’t load your summary. Please retry.",
  );
  const { stats, isLoading: enrichmentLoading } = useEnrichmentStats();
  const source =
    personaRes?.data != null
      ? personaToInsightSource(personaRes.data)
      : userContextToInsightSource(
          (contextData?.data ?? user?.context) as IUser["context"] | undefined,
        );
  const insights = categories.flatMap((category) =>
    (source[category.key] ?? []).map((text, index) => ({
      ...category,
      id: `${category.key}-${index}`,
      text: normalizeObservationForDisplay(text),
    })),
  );
  const filtered = insights.filter((item) =>
    item.text.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const summary = summaryRes?.data?.summary?.trim() || source.self_description;
  const score = Math.min(
    100,
    Math.max(0, Number(stats?.enrichment_score) || 0),
  );

  function renderInsights(preferencesOnly = false) {
    const items = preferencesOnly
      ? filtered.filter((item) => item.key === "key_preferences")
      : filtered;
    if (error)
      return (
        <div className="insights-empty">
          <p>Couldn’t load your insights.</p>
          <Button variant="outline" onClick={retry}>
            Retry insights
          </Button>
        </div>
      );
    if (isLoading && !insights.length)
      return (
        <div className="insights-empty" role="status">
          <Spinner />
          Loading your insights…
        </div>
      );
    if (!items.length)
      return (
        <div className="insights-empty">
          <Archive className="size-8 text-icon-neutral-weak" />
          <p className="text-text-neutral-strong">
            {query ? "No matching insights" : "Your insights are taking shape"}
          </p>
          <p>
            {query
              ? "Try another word or clear your search."
              : "Keep saving memories and reflecting. Your patterns and preferences will appear here."}
          </p>
          {query && (
            <Button variant="ghost" onClick={() => setQuery("")}>
              Clear search
            </Button>
          )}
        </div>
      );
    return (
      <div className="insights-collection">
        {items.map((item) => (
          <article
            key={item.id}
            className={cn(
              "insights-row",
              expanded === item.id && "insights-row-expanded",
            )}
          >
            <Archive
              aria-hidden="true"
              className={cn("mt-1 size-7 shrink-0", item.color)}
              strokeWidth={1.8}
            />
            <div className="min-w-0 flex-1">
              <h3
                className={cn(
                  "font-inter text-base font-medium text-text-neutral-strong",
                  expanded !== item.id && "truncate",
                )}
              >
                {item.text}
              </h3>
              <p className="mt-2 truncate font-inter text-sm text-text-neutral-weak">
                {item.label} · From your memories and reflections
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-full"
                  aria-label={`Options for ${item.text}`}
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[120]">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onSelect={() =>
                      setExpanded(expanded === item.id ? null : item.id)
                    }
                  >
                    {expanded === item.id ? "Collapse insight" : "Read insight"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={async () => {
                      try {
                        await navigator.clipboard.writeText(item.text);
                        toast.success("Insight copied");
                      } catch {
                        toast.error("Couldn’t copy this insight");
                      }
                    }}
                  >
                    Copy insight
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </article>
        ))}
      </div>
    );
  }

  const about = (
    <section className="insights-detail">
      <h3 className="font-garamond text-3xl text-text-neutral-strong">
        About me
      </h3>
      {summaryError ? (
        <Button variant="outline" onClick={retrySummary}>
          Retry summary
        </Button>
      ) : summaryLoading ? (
        <p role="status">Gathering your story…</p>
      ) : (
        <p className="whitespace-pre-line leading-relaxed text-text-neutral-weak">
          {summary ||
            "As you save memories and reflect, a portrait of who you are will take shape here."}
        </p>
      )}
    </section>
  );
  const enrichment = (
    <section className="insights-detail">
      <h3 className="font-garamond text-3xl text-text-neutral-strong">
        Your enrichment score
      </h3>
      {enrichmentLoading ? (
        <p role="status">Loading your progress…</p>
      ) : (
        <>
          <p className="text-3xl text-text-neutral-strong">{score}%</p>
          <Progress value={score} aria-label="Enrichment score" />
          <p className="text-text-neutral-weak">
            A reflection of the breadth of your memories. Keep exploring the
            moments, people, and experiences that make you who you are.
          </p>
        </>
      )}
    </section>
  );

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) close("memory-insights");
      }}
    >
      <DialogContent
        showCloseButton={false}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (returnFocus.current?.isConnected) returnFocus.current.focus();
        }}
        className="insights-overlay"
        overlayClassName="z-[100] bg-bg-neutral-solid"
      >
        <DashboardHeader
          overlay={{
            title: (
              <DialogTitle className="font-garamond text-3xl font-medium sm:text-4xl">
                My <em>insights</em>
              </DialogTitle>
            ),
            searchLabel: "Search insights",
            closeLabel: "Close memory insights",
            searchExpanded: searchOpen,
            onSearch: () => {
              setSearchOpen((value) => !value);
              setQuery("");
            },
            onClose: () => close("memory-insights"),
          }}
        />
        <DialogDescription className="sr-only">
          Explore your memories, observations, preferences, and personal
          progress.
        </DialogDescription>
        <div className="insights-scroll">
          <main className="insights-main">
            <MemoryStatistics />
            {searchOpen && (
              <div className="relative">
                <Search className="absolute left-4 top-3 size-5 text-icon-neutral-weak" />
                <Input
                  autoFocus
                  aria-label="Search your insights"
                  placeholder="Search your insights…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-12 rounded-full pl-12"
                />
              </div>
            )}
            <InsightsOverlayNavigation
              content={{
                all: (
                  <div className="flex flex-col gap-6">
                    {about}
                    {renderInsights()}
                  </div>
                ),
                about,
                observations: renderInsights(),
                preferences: renderInsights(true),
                enrichment,
              }}
            />
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}

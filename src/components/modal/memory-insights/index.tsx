import { useEffect, useRef, useState, type ReactNode } from "react";
import { Archive, Search, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import endpoint from "@/api/endpoint";
import { useApi } from "@/hooks/use-api";
import { useModal } from "@/hooks/use-modal";
import { useRequestRecovery } from "@/hooks/use-request-recovery";
import { DashboardHeader } from "@/pages/dashboard/component/dashboard-header";
import { DashboardOverlayFrame } from "@/pages/dashboard/component/dashboard-overlay-frame";
import type { EnrichmentCategory } from "@/features/enrichment/enrichment-categories";
import { EnrichmentFieldsTable } from "@/features/insights/enrichment-fields-table";
import { getEnrichmentField } from "@/features/insights/enrichment-fields";
import {
  EnrichmentFieldDetail,
  InsightDetail,
} from "@/features/insights/insight-detail";
import type {
  Insight,
  InsightSource,
} from "@/features/insights/insights-api.types";
import {
  InsightsOverlayNavigation,
  type InsightsSection,
} from "@/features/insights/insights-overlay-navigation";
import { InsightsPanel } from "@/features/insights/insights-panel";
import { MemoryStatistics } from "@/features/insights/memory-statistics";
import {
  normalizeObservationForDisplay,
  splitObservation,
} from "@/features/insights/observation-display";
import {
  ObservationList,
  type ObservationItem,
} from "@/features/insights/observation-list";
import type {
  ObservationField,
  PersonaObservation,
  PersonaObservationsResponse,
} from "@/features/insights/observations-api.types";
import { PlanSummaryCard } from "@/features/insights/plan-summary-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./insights.css";

/** Everything Memento has noticed about the member, except their preferences. */
const OBSERVATION_DETAILS: Record<ObservationField, string> = {
  important_notes: "Something you’ve shared",
  goals_and_aspirations: "Something you’re working toward",
  emotional_state_trends: "A pattern in how you feel",
  key_preferences: "Something you prefer",
};

function toItem(observation: PersonaObservation): ObservationItem {
  const { title, detail } = splitObservation(
    normalizeObservationForDisplay(observation.content),
  );
  return {
    id: observation.id,
    title,
    detail: detail || OBSERVATION_DETAILS[observation.field],
    note: detail,
  };
}

type View =
  | { kind: "insight"; insight: Insight }
  | { kind: "field"; field: EnrichmentCategory };

export default function MemoryInsightsModal() {
  const { close } = useModal();
  const navigate = useNavigate();
  const returnFocus = useRef(
    typeof document !== "undefined" &&
      document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<InsightsSection>("observations");
  const [history, setHistory] = useState<View[]>([]);
  const view = history.at(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const isFirstView = useRef(true);
  const { key: locationKey } = useLocation();
  const openedAtLocation = useRef(locationKey);

  // Any navigation leaves Insights, or the new page would stay hidden behind it.
  useEffect(() => {
    if (locationKey !== openedAtLocation.current) close("memory-insights");
  }, [locationKey, close]);

  useEffect(() => {
    if (isFirstView.current) {
      isFirstView.current = false;
      return;
    }
    scrollRef.current?.scrollTo?.({ top: 0 });
    mainRef.current?.focus({ preventScroll: true });
  }, [history.length]);

  const {
    data: observationsRes,
    isLoading,
    error,
    mutate,
  } = useApi<PersonaObservationsResponse>(endpoint.personaObservations);
  const retry = useRequestRecovery(
    "insights-persona",
    error,
    mutate,
    "Couldn’t load your insights. Please retry.",
  );
  const needle = query.trim().toLowerCase();
  const matches = (item: ObservationItem) =>
    `${item.title} ${item.detail}`.toLowerCase().includes(needle);
  const all = observationsRes?.data?.observations ?? [];
  const observations = all
    .filter((item) => item.field !== "key_preferences")
    .map(toItem);
  const preferences = all
    .filter((item) => item.field === "key_preferences")
    .map(toItem);

  function renderList(
    items: ObservationItem[],
    emptyTitle: string,
    emptyBody: string,
  ): ReactNode {
    if (error)
      return (
        <div className="insights-empty">
          <p>Couldn’t load your insights.</p>
          <Button variant="outline" onClick={retry}>
            Retry insights
          </Button>
        </div>
      );
    if (isLoading && !items.length)
      return (
        <div className="insights-empty" role="status">
          <Spinner />
          Loading your insights…
        </div>
      );
    return (
      <ObservationList
        items={items.filter(matches)}
        onViewSource={viewSource}
        onChanged={() => mutate()}
        empty={
          <div className="insights-empty">
            <Archive className="size-8 text-icon-neutral-weak" aria-hidden />
            <p className="text-text-neutral-strong">
              {query ? "No matches" : emptyTitle}
            </p>
            <p>{query ? "Try another word or clear your search." : emptyBody}</p>
            {query && (
              <Button variant="ghost" onClick={() => setQuery("")}>
                Clear search
              </Button>
            )}
          </div>
        }
      />
    );
  }

  const leaveTo = (href: string, state?: unknown) => {
    close("memory-insights");
    navigate(href, { state });
  };
  const viewSource = (memory: InsightSource) =>
    leaveTo(
      memory.type === "conversation"
        ? `/chat/${memory.id}`
        : `/stories/${memory.id}`,
    );
  const reflectOn = (field: EnrichmentCategory) =>
    leaveTo("/chat", {
      overviewDiscussion: `I’d like to reflect on ${getEnrichmentField(field).label.toLowerCase()}.`,
    });
  const openView = (next: View) => {
    setHistory((current) => [...current, next]);
    setQuery("");
    setSearchOpen(false);
  };
  const goBack = () => {
    setHistory((current) => current.slice(0, -1));
    setQuery("");
    setSearchOpen(false);
  };
  const openInsight = (insight: Insight) =>
    openView({ kind: "insight", insight });

  const searchBox = searchOpen && (
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
        overlayClassName="insights-overlay-backdrop z-[100]"
      >
        <TooltipProvider>
          <DashboardOverlayFrame>
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
            Explore your observations, insights, preferences, and enrichment
            fields.
          </DialogDescription>
          <div className="insights-scroll" ref={scrollRef}>
            <main className="insights-main" ref={mainRef} tabIndex={-1}>
              {view ? (
                <>
                  {searchBox}
                  {view.kind === "insight" ? (
                    <InsightDetail
                      insight={view.insight}
                      query={query}
                      onBack={goBack}
                      onView={viewSource}
                    />
                  ) : (
                    <EnrichmentFieldDetail
                      field={view.field}
                      query={query}
                      onBack={goBack}
                      onView={viewSource}
                      onOpenInsight={openInsight}
                      onReflect={reflectOn}
                    />
                  )}
                </>
              ) : (
                <>
                  <div className="insights-page-heading justify-between">
                    <h2 className="font-garamond text-4xl text-text-neutral-strong">
                      Insights
                    </h2>
                    <Button
                      variant="ghost"
                      size="icon-lg"
                      className="insights-round-button"
                      aria-label="Insight settings"
                      onClick={() => leaveTo("/settings/general?view=about")}
                    >
                      <Settings aria-hidden />
                    </Button>
                  </div>
                  <div className="flex flex-col gap-4">
                    <MemoryStatistics />
                    <PlanSummaryCard onNavigate={(href) => leaveTo(href)} />
                  </div>
                  {searchBox}
                  <InsightsOverlayNavigation
                    value={section}
                    onValueChange={setSection}
                    content={{
                      observations: renderList(
                        observations,
                        "Your observations are taking shape",
                        "Keep saving memories and reflecting. What Memento notices about you will appear here.",
                      ),
                      insights: (
                        <InsightsPanel query={query} onOpen={openInsight} />
                      ),
                      preferences: renderList(
                        preferences,
                        "No preferences yet",
                        "As you share what you like and dislike, your preferences will appear here.",
                      ),
                      enrichment: (
                        <EnrichmentFieldsTable
                          query={query}
                          onExplore={(field) =>
                            openView({ kind: "field", field })
                          }
                        />
                      ),
                    }}
                  />
                </>
              )}
            </main>
          </div>
          </DashboardOverlayFrame>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}

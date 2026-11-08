import "@/components/motion/page-motion.css";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Archive } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useModal } from "@/hooks/use-modal";
import { PageHeading } from "@/pages/dashboard/component/page-heading";
import { useRequestRecovery } from "@/hooks/use-request-recovery";
import type { EnrichmentCategory } from "@/features/enrichment/enrichment-categories";
import { EnrichmentFieldsTable } from "@/features/insights/enrichment-fields-table";
import { getEnrichmentField } from "@/features/insights/enrichment-fields";
import {
  EnrichmentFieldDetail,
  InsightDetail,
  ObservationDetail,
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
import { MilestonesPanel } from "@/features/insights/milestones-panel";
import {
  ObservationList,
  type ObservationItem,
} from "@/features/insights/observation-list";
import type { PersonaObservation } from "@/features/insights/observations-api.types";
import { useObservations } from "@/features/insights/use-observations";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/components/modal/memory-insights/insights.css";

function toItem(observation: PersonaObservation): ObservationItem {
  return {
    id: observation.id,
    title: observation.heading,
    detail: observation.note,
    category: observation.category_key,
  };
}

/** Where to pick up again when coming back to this page from one of its sources. */
type ReturnState = {
  section?: InsightsSection;
  history?: View[];
};

type View =
  | { kind: "insight"; insight: Insight }
  | { kind: "observation"; item: ObservationItem }
  | { kind: "field"; field: EnrichmentCategory };

export default function InsightsPage() {
  const { push } = useModal();
  const navigate = useNavigate();
  const location = useLocation();
  const returnState = location.state as ReturnState | null;
  const [section, setSection] = useState<InsightsSection>(
    returnState?.section ?? "observations",
  );
  const [history, setHistory] = useState<View[]>(returnState?.history ?? []);
  const view = history.at(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const isFirstView = useRef(true);

  useEffect(() => {
    if (isFirstView.current) {
      isFirstView.current = false;
      return;
    }
    scrollRef.current?.scrollTo?.({ top: 0 });
    mainRef.current?.focus({ preventScroll: true });
  }, [history.length]);

  const {
    observations: all,
    loaded,
    generating,
    isLoading,
    error,
    mutate,
    remove,
  } = useObservations();
  // Memento can forget a note while it is open, so its page closes with it.
  useEffect(() => {
    if (!loaded) return;
    const ids = new Set(all.map((item) => item.id));
    setHistory((current) => {
      const kept = current.filter(
        (view) => view.kind !== "observation" || ids.has(view.item.id),
      );
      return kept.length === current.length ? current : kept;
    });
  }, [all, loaded]);
  // ?observation=<id> opens that observation (voice "show me…", chat links),
  // once its list has loaded, on each navigation.
  const requestedObservation = new URLSearchParams(location.search).get("observation");
  useEffect(() => {
    if (!loaded || !requestedObservation) return;
    const found = all.find((entry) => entry.id === requestedObservation);
    if (!found) return;
    const item = toItem(found);
    setSection(found.field === "key_preferences" ? "preferences" : "observations");
    setHistory((current) =>
      current.at(-1)?.kind === "observation" && (current.at(-1) as { item: ObservationItem }).item.id === item.id
        ? current
        : [...current, { kind: "observation", item }],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, requestedObservation, location.key]);
  const retry = useRequestRecovery(
    "insights-persona",
    error,
    mutate,
    "Couldn’t load your insights. Please retry.",
  );
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
    if ((isLoading || generating) && !items.length)
      return (
        <div className="insights-empty" role="status">
          <Spinner />
          {generating
            ? "Going through what you’ve shared…"
            : "Loading your insights…"}
        </div>
      );
    return (
      <ObservationList
        items={items}
        onOpen={(item) => openView({ kind: "observation", item })}
        onChanged={() => mutate()}
        onForget={remove}
        empty={
          <div className="insights-empty">
            <Archive className="size-8 text-icon-neutral-weak" aria-hidden />
            <p className="text-text-neutral-strong">{emptyTitle}</p>
            <p>{emptyBody}</p>
          </div>
        }
      />
    );
  }

  const viewSource = (memory: InsightSource) => {
    if (memory.type !== "conversation" && window.innerWidth >= 640) {
      // The viewer opens above this page, so closing it lands right back here.
      push?.("view-memory", { memoryId: memory.id });
      return;
    }
    // Full pages have no close, so going back returns to this entry's saved place.
    const here: ReturnState = { section, history };
    navigate(location.pathname, { replace: true, state: here });
    navigate(
      memory.type === "conversation"
        ? `/chat/${memory.id}`
        : `/stories/${memory.id}`,
    );
  };
  const reflectOn = (field: EnrichmentCategory) =>
    navigate("/chat", {
      state: {
        overviewDiscussion: `I’d like to reflect on ${getEnrichmentField(field).label.toLowerCase()}.`,
      },
    });
  const openView = (next: View) => setHistory((current) => [...current, next]);
  const goBack = () => setHistory((current) => current.slice(0, -1));
  const openInsight = (insight: Insight) =>
    openView({ kind: "insight", insight });

  return (
    <TooltipProvider>
      <div className="insights-page">
        <div className="insights-scroll" ref={scrollRef}>
          <main
            className="page-motion insights-main"
            ref={mainRef}
            tabIndex={-1}
          >
            {view ? (
              <div
                key={history.length}
                className="page-fade-in flex min-w-0 flex-col [gap:inherit]"
              >
                {view.kind === "insight" ? (
                  <InsightDetail
                    insight={view.insight}
                    onBack={goBack}
                    onView={viewSource}
                  />
                ) : view.kind === "observation" ? (
                  <ObservationDetail
                    item={view.item}
                    onBack={goBack}
                    onView={viewSource}
                  />
                ) : (
                  <EnrichmentFieldDetail
                    field={view.field}
                    onBack={goBack}
                    onView={viewSource}
                    onReflect={reflectOn}
                  />
                )}
              </div>
            ) : (
              <>
                <PageHeading className="page-rise page-rise--heading">
                  My <em>insights</em>
                </PageHeading>
                <div
                  className="page-rise"
                  style={{ "--page-rise-index": 1 } as CSSProperties}
                >
                  <MemoryStatistics />
                </div>
                <div
                  className="page-rise min-w-0"
                  style={{ "--page-rise-index": 2 } as CSSProperties}
                >
                  <InsightsOverlayNavigation
                    value={section}
                    onValueChange={setSection}
                    content={{
                      observations: renderList(
                        observations,
                        "Your observations are taking shape",
                        "Keep saving memories and reflecting. What Memento notices about you will appear here.",
                      ),
                      insights: <InsightsPanel onOpen={openInsight} />,
                      preferences: renderList(
                        preferences,
                        "No preferences yet",
                        "As you share what you like and dislike, your preferences will appear here.",
                      ),
                      enrichment: (
                        <EnrichmentFieldsTable
                          onExplore={(field) =>
                            openView({ kind: "field", field })
                          }
                        />
                      ),
                      milestones: <MilestonesPanel />,
                    }}
                  />
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

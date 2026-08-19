import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useSWR from "swr";
import {
  ChevronDown,
  Heart,
  ListChecks,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import { useApi } from "@/hooks/use-api";
import { useEnrichmentStats } from "@/features/enrichment/use-enrichment-stats";
import {
  AtAGlanceCard,
  useAtAGlanceCards,
} from "@/features/enrichment/at-a-glance-cards";
import {
  NarrativeInsightsBlock,
  useNarrativeInsights,
} from "@/features/enrichment/narrative-insights";
import { InsightsOverlayNavigation } from "@/features/insights/insights-overlay-navigation";
import { normalizeObservationForDisplay } from "@/features/insights/observation-display";
import { TimesIcon, PlusIcon } from "@/components/icons";
import endpoint from "@/api/endpoint";
import type { IBeneficiary, IPersona, IUser } from "@/utility/interface";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

function formatSummaryGeneratedAt(
  iso: string | null | undefined,
): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return new Date(t).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const MEMORY_INSIGHTS_HERO_SNOOZE_UNTIL_KEY =
  "memento:memory-insights-hero-snooze-until";

function readHeroSnoozeUntilMs(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MEMORY_INSIGHTS_HERO_SNOOZE_UNTIL_KEY);
    if (!raw) return null;
    const t = Date.parse(raw);
    if (Number.isNaN(t) || t <= Date.now()) {
      localStorage.removeItem(MEMORY_INSIGHTS_HERO_SNOOZE_UNTIL_KEY);
      return null;
    }
    return t;
  } catch {
    return null;
  }
}

function persistHeroSnoozeDays(days: number): number {
  const until = Date.now() + days * 24 * 60 * 60 * 1000;
  try {
    localStorage.setItem(
      MEMORY_INSIGHTS_HERO_SNOOZE_UNTIL_KEY,
      new Date(until).toISOString(),
    );
  } catch {
    /* ignore */
  }
  return until;
}

function clearHeroSnooze(): void {
  try {
    localStorage.removeItem(MEMORY_INSIGHTS_HERO_SNOOZE_UNTIL_KEY);
  } catch {
    /* ignore */
  }
}

const DEFAULT_TAB = "all";

const OBSERVATION_TABS = [
  { label: "All", key: "all" },
  { label: "Preferences", key: "key_preferences" },
  { label: "Notes", key: "important_notes" },
  { label: "Goals", key: "goals_and_aspirations" },
  { label: "Emotions", key: "emotional_state_trends" },
];

const INSIGHT_ICONS: Record<string, typeof Target> = {
  important_notes: ListChecks,
  key_preferences: UserRound,
  goals_and_aspirations: Target,
  emotional_state_trends: Heart,
};

function getInitials(name: string) {
  return (name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function MemoryInsightsModal() {
  const { close, open } = useModal();
  const { user } = useStore();
  const [activeCategory, setActiveCategory] = useState(DEFAULT_TAB);
  const [observationsOpen, setObservationsOpen] = useState(false);

  const {
    stats: enrichmentStats,
    isLoading: enrichmentLoading,
    nudgeQuestion,
  } = useEnrichmentStats();
  const atAGlance = useAtAGlanceCards();
  const narrativeInsights = useNarrativeInsights();

  const { data: personaRes } = useApi<IPersona | null>(endpoint.persona);
  const {
    data: summaryRes,
    isLoading: summaryLoading,
    error: summaryError,
  } = useApi<MemoryInsightsSummaryDto>(endpoint.personaMemoryInsightsSummary);
  const { data: beneficiariesData } = useSWR(
    `${endpoint.beneficiaries}?page=1`,
  );
  const { data: contextData } = useSWR(endpoint.userContext);
  const { data: profileData } = useSWR(endpoint.profile);

  const primaryConversationId =
    (
      profileData?.data as
        | { primary_conversation_id?: string | null }
        | undefined
    )?.primary_conversation_id ?? undefined;

  const insightSource = useMemo((): MemoryInsightSource => {
    const personaPayload = personaRes?.data;
    if (personaPayload != null) {
      return personaToInsightSource(personaPayload);
    }
    const fromContext = contextData?.data ?? user?.context;
    return userContextToInsightSource(
      fromContext as Record<string, unknown> | undefined,
    );
  }, [personaRes?.data, contextData?.data, user?.context]);

  const beneficiaries: IBeneficiary[] = beneficiariesData?.data?.docs || [];
  const aiSummary = summaryRes?.data?.summary?.trim() ?? null;
  const summaryUpdatedLabel = formatSummaryGeneratedAt(
    summaryRes?.data?.generated_at,
  );

  const enrichmentScore = Math.round(
    Number(enrichmentStats?.enrichment_score) || 0,
  );
  const jumpPills = enrichmentStats?.jump_pills ?? [];
  const spotlight = enrichmentStats?.spotlight ?? null;
  const narrativeLoading = summaryLoading && !aiSummary;
  const enrichmentReady = !enrichmentLoading;

  const [heroSnoozeUntil, setHeroSnoozeUntil] = useState<number | null>(() =>
    readHeroSnoozeUntilMs(),
  );
  const heroSnoozed = heroSnoozeUntil != null && heroSnoozeUntil > Date.now();
  const heroSnoozeDateLabel =
    heroSnoozeUntil != null
      ? new Date(heroSnoozeUntil).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "";

  const hostChatWithStarterHref = (starter: string) => {
    const q = new URLSearchParams({ starter }).toString();
    if (primaryConversationId) return `/chat/${primaryConversationId}?${q}`;
    return `/chat?${q}`;
  };

  const openHostChatHref = primaryConversationId
    ? `/chat/${primaryConversationId}`
    : "/chat";
  const allInsights = [
    ...(insightSource.important_notes || []).map((text: string) => ({
      text,
      category: "important_notes",
    })),
    ...(insightSource.key_preferences || []).map((text: string) => ({
      text,
      category: "key_preferences",
    })),
    ...(insightSource.goals_and_aspirations || []).map((text: string) => ({
      text,
      category: "goals_and_aspirations",
    })),
    ...(insightSource.emotional_state_trends || []).map((text: string) => ({
      text,
      category: "emotional_state_trends",
    })),
  ];

  const filtered =
    activeCategory === "all"
      ? allInsights
      : allInsights.filter((i) => i.category === activeCategory);

  return (
    <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-[24px] bg-white shadow-xl">
      <div className="flex items-start justify-between gap-3 border-b border-v3-stroke-weak px-6 py-5">
        <div className="min-w-0">
          <h2 className="font-garamond text-2xl font-medium text-v3-text-strong">
            Memory insights
          </h2>
          <p className="mt-1 font-inter text-sm text-v3-text-weak text-pretty">
            A personal snapshot—not a scorecard.
          </p>
        </div>
        <Button
          onClick={() => close()}
          variant="ghost"
          size="icon-xs"
          className="size-8 shrink-0 rounded-full bg-v3-fill-weak text-v3-icon-neutral transition-transform duration-150 ease-out hover:bg-v3-fill-weak/80 active:scale-[0.97]"
        >
          <TimesIcon width={10} height={10} className="text-v3-icon-neutral" />
        </Button>
      </div>

      <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
        <InsightsOverlayNavigation
          content={{
            general: (
              <div className="space-y-6">
                {heroSnoozed ? (
                  <div className="flex flex-col gap-3 rounded-2xl border border-v3-stroke-weak bg-v3-fill-weaker/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-inter text-sm leading-relaxed text-v3-text-weak text-pretty">
                      Snapshot hidden until {heroSnoozeDateLabel}. Insights and
                      At a glance below are unchanged.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 rounded-xl border-v3-stroke-weak font-inter text-xs font-semibold"
                      onClick={() => {
                        clearHeroSnooze();
                        setHeroSnoozeUntil(null);
                      }}
                    >
                      Show snapshot
                    </Button>
                  </div>
                ) : (
                  <Card className="overflow-hidden rounded-2xl border border-v3-stroke-weak bg-v3-fill-weaker/60 shadow-none">
                    <div className="space-y-4 p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className="border-v3-stroke-weak bg-white/80 font-inter text-[10px] font-semibold uppercase tracking-widest text-v3-text-weak"
                        >
                          Snapshot
                        </Badge>
                        {narrativeLoading ? (
                          <span className="inline-flex items-center gap-2 font-inter text-sm text-v3-text-weak">
                            <Spinner className="size-4 text-v3-icon-neutral" />
                            Crafting your summary…
                          </span>
                        ) : null}
                      </div>

                      {spotlight ? (
                        <div className="space-y-3 rounded-xl border border-v3-stroke-weak bg-white/90 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-inter text-xs font-medium text-v3-text-weak">
                              A thread from your Memento
                            </p>
                            <Badge
                              variant="outline"
                              className="shrink-0 border-v3-stroke-weak bg-v3-fill-weaker font-inter text-[10px] font-medium uppercase tracking-wide text-v3-text-weak"
                            >
                              {spotlight.source === "conversation"
                                ? "From conversation"
                                : "Your story"}
                            </Badge>
                          </div>
                          {spotlight.title ? (
                            <p className="font-garamond text-lg font-medium leading-snug text-v3-text-strong text-pretty">
                              {spotlight.title}
                            </p>
                          ) : null}
                          <p className="font-inter text-sm leading-relaxed text-v3-text-strong text-pretty">
                            {spotlight.excerpt}
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl border-v3-stroke-weak font-inter text-xs font-semibold transition-transform duration-150 ease-out active:scale-[0.98]"
                              asChild
                            >
                              <Link
                                to={
                                  spotlight.source === "conversation"
                                    ? `/chat/${spotlight.memory_id}`
                                    : `/stories/${spotlight.memory_id}`
                                }
                                onClick={() => close()}
                              >
                                Open this memory
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ) : null}

                      {summaryError ? (
                        <p className="font-inter text-sm text-v3-text-weak">
                          We couldn&apos;t load your summary right now. You can
                          still browse observations below.
                        </p>
                      ) : null}

                      {!summaryError && aiSummary ? (
                        <div className="font-inter text-sm leading-relaxed text-v3-text-strong">
                          {aiSummary.split("\n\n").map((block, i) => (
                            <p key={i} className="m-0 mb-3 last:mb-0">
                              {block}
                            </p>
                          ))}
                          {summaryUpdatedLabel ? (
                            <p className="mt-1 font-inter text-xs text-v3-text-weaker">
                              Updated {summaryUpdatedLabel}
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      {!summaryError && !narrativeLoading && !aiSummary ? (
                        <div className="flex flex-col items-center rounded-xl border border-dashed border-v3-stroke-weak bg-white/50 py-10 text-center">
                          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-v3-fill-weak">
                            <Sparkles className="size-5 text-v3-icon-neutral" />
                          </div>
                          <p className="font-inter text-sm font-medium text-v3-text-strong">
                            Your summary is being built
                          </p>
                          <p className="mt-1 max-w-[260px] font-inter text-xs text-v3-text-weak text-pretty">
                            Add memories and chat so we can reflect who you are
                            in your own words.
                          </p>
                        </div>
                      ) : null}

                      {enrichmentReady && nudgeQuestion ? (
                        <>
                          <Separator className="bg-v3-stroke-weak" />
                          <div className="space-y-2">
                            <p className="font-inter text-xs font-medium text-v3-text-weak">
                              Something to explore
                            </p>
                            <p className="font-inter text-[15px] leading-snug text-v3-text-strong text-pretty">
                              {nudgeQuestion}
                            </p>
                          </div>
                        </>
                      ) : null}

                      {enrichmentReady && jumpPills.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          <p className="font-inter text-xs font-medium text-v3-text-weak">
                            Try in host chat
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {jumpPills.slice(0, 3).map((pill) => (
                              <Button
                                key={pill.category_key}
                                variant="outline"
                                size="sm"
                                className="h-auto max-w-full rounded-xl border-v3-stroke-weak bg-white/90 py-2 font-inter text-xs font-medium text-v3-text-strong transition-transform duration-150 ease-out hover:bg-v3-fill-weaker active:scale-[0.98]"
                                asChild
                              >
                                <Link
                                  to={hostChatWithStarterHref(pill.starter)}
                                  onClick={() => close()}
                                  className="inline-flex max-w-full"
                                >
                                  <span className="line-clamp-2 text-left">
                                    {pill.starter}
                                  </span>
                                </Link>
                              </Button>
                            ))}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="font-inter text-xs font-semibold text-v3-text-strong underline-offset-2 hover:underline"
                              asChild
                            >
                              <Link
                                to={openHostChatHref}
                                onClick={() => close()}
                              >
                                Open host chat
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ) : null}

                      {enrichmentReady ? (
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-inter text-[11px] font-medium uppercase tracking-widest text-v3-text-weaker">
                              Breadth
                            </span>
                            <span className="font-inter text-xs tabular-nums text-v3-text-weak">
                              About {enrichmentScore}%
                            </span>
                          </div>
                          <Progress
                            value={Math.min(100, Math.max(0, enrichmentScore))}
                            className="h-1.5 bg-v3-fill-weaker [&_[data-slot=progress-indicator]]:bg-v3-brand-strong"
                          />
                          <p className="font-inter text-[11px] leading-relaxed text-v3-text-weaker text-pretty">
                            This number is a gentle guide—not a grade.
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-v3-stroke-weak/80 bg-white/40 px-5 py-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="font-inter text-xs font-medium text-v3-text-weak hover:text-v3-text-strong"
                        onClick={() =>
                          setHeroSnoozeUntil(persistHeroSnoozeDays(7))
                        }
                      >
                        Hide snapshot for a week
                      </Button>
                    </div>
                  </Card>
                )}

                <section
                  aria-labelledby="memory-insights-narrative-heading"
                  className="space-y-3"
                >
                  <p
                    id="memory-insights-narrative-heading"
                    className="font-inter text-[11px] font-semibold uppercase tracking-widest text-v3-text-weaker"
                  >
                    Insights
                  </p>
                  <NarrativeInsightsBlock insights={narrativeInsights} />
                </section>

                <section
                  aria-labelledby="memory-insights-glance-heading"
                  className="space-y-3"
                >
                  <p
                    id="memory-insights-glance-heading"
                    className="font-inter text-[11px] font-semibold uppercase tracking-widest text-v3-text-weaker"
                  >
                    At a glance
                  </p>
                  <p className="font-inter text-xs text-v3-text-weak text-pretty">
                    Quick numbers—the stories and invitations above carry the
                    human thread.
                  </p>
                  <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-1">
                    {atAGlance.map((card, i) => (
                      <AtAGlanceCard key={i} {...card} />
                    ))}
                  </div>
                </section>

                {/* Beneficiaries */}
                <section
                  aria-labelledby="memory-insights-beneficiaries-label"
                  className="space-y-3"
                >
                  {beneficiaries.length > 0 ? (
                    <p className="font-inter text-xs leading-relaxed text-v3-text-weak text-pretty">
                      You&apos;re shaping this for the people who matter to
                      you—take your time.
                    </p>
                  ) : null}
                  <Label
                    id="memory-insights-beneficiaries-label"
                    className="font-inter text-[11px] font-semibold uppercase tracking-widest text-v3-text-weak"
                  >
                    Beneficiaries
                  </Label>
                  {beneficiaries.length === 0 ? (
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={() => open("add-beneficiary")}
                        variant="outline"
                        size="icon"
                        className="size-12 shrink-0 rounded-full border-2 border-dashed border-v3-stroke-weak transition-transform duration-150 ease-out hover:border-v3-brand-strong hover:bg-v3-brand-strong/10 active:scale-[0.97]"
                      >
                        <PlusIcon className="size-4 text-v3-icon-neutral" />
                      </Button>
                      <div>
                        <p className="font-inter text-sm font-medium text-v3-text-strong">
                          No beneficiaries yet
                        </p>
                        <p className="mt-0.5 font-inter text-xs text-v3-text-weak">
                          Add people who can access your Memento.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-start gap-4">
                      {beneficiaries.slice(0, 5).map((b) => (
                        <div
                          key={b._id}
                          className="flex w-14 flex-col items-center gap-1.5"
                        >
                          <Avatar className="size-12 bg-v3-fill-weak" size="lg">
                            {b.user?.picture_url ? (
                              <AvatarImage
                                src={b.user.picture_url}
                                alt={b.name}
                              />
                            ) : (
                              <AvatarFallback className="bg-v3-fill-weak font-inter text-sm font-semibold text-v3-text-strong">
                                {getInitials(b.name)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span className="w-full truncate text-center font-inter text-xs font-medium leading-tight text-v3-text-strong">
                            {b.name?.split(" ")[0]}
                          </span>
                          <span className="w-full text-center font-inter text-[10px] capitalize leading-tight text-v3-text-weak">
                            {b.relationship}
                          </span>
                        </div>
                      ))}

                      <div className="flex w-14 flex-col items-center gap-1.5">
                        <Button
                          onClick={() => open("add-beneficiary")}
                          variant="outline"
                          size="icon"
                          className="size-12 rounded-full border-2 border-dashed border-v3-stroke-weak transition-transform duration-150 ease-out hover:border-v3-brand-strong hover:bg-v3-brand-strong/10 active:scale-[0.97]"
                        >
                          <PlusIcon className="size-4 text-v3-icon-neutral" />
                        </Button>
                        <span className="text-center font-inter text-xs text-v3-text-weak">
                          Add
                        </span>
                      </div>
                    </div>
                  )}
                </section>

                <Separator className="bg-v3-stroke-weak" />

                {/* Power-user escape hatch */}
                <details
                  className="group rounded-2xl border border-v3-stroke-weak bg-white transition-[box-shadow] duration-200 ease-out open:shadow-sm"
                  onToggle={(e) =>
                    setObservationsOpen((e.target as HTMLDetailsElement).open)
                  }
                >
                  <summary
                    data-testid="memory-insights-observations-toggle"
                    className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 font-inter text-sm font-semibold text-v3-text-strong outline-none transition-colors duration-150 ease-out hover:bg-v3-fill-weaker [&::-webkit-details-marker]:hidden"
                  >
                    <span>All observations</span>
                    <ChevronDown className="size-4 shrink-0 text-v3-icon-neutral transition-transform duration-200 ease-out group-open:rotate-180" />
                  </summary>

                  {observationsOpen ? (
                    <div className="border-t border-v3-stroke-weak px-3 pb-4 pt-2">
                      <p className="mb-3 px-1 font-inter text-xs leading-relaxed text-v3-text-weak text-pretty">
                        These lines are raw building blocks—edit your story
                        anytime so it sounds like you, not a report about you.
                      </p>
                      <Tabs
                        value={activeCategory}
                        onValueChange={setActiveCategory}
                        className="w-full"
                      >
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-3 bg-gradient-to-r from-white to-transparent" />
                          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-3 bg-gradient-to-l from-white to-transparent" />
                          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-v3-fill-weaker p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {OBSERVATION_TABS.map((cat) => (
                              <TabsTrigger
                                key={cat.key}
                                value={cat.key}
                                className="shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 font-inter text-xs font-medium text-v3-text-weak data-active:bg-white data-active:text-v3-text-strong data-active:shadow-sm"
                              >
                                {cat.label}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                        </div>
                      </Tabs>

                      <div className="mt-4 px-1">
                        <p className="mb-3 font-inter text-[11px] font-semibold uppercase tracking-widest text-v3-text-weak">
                          {
                            OBSERVATION_TABS.find(
                              (c) => c.key === activeCategory,
                            )?.label
                          }
                        </p>

                        {filtered.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-v3-fill-weak">
                              <Sparkles className="size-5 text-v3-icon-neutral" />
                            </div>
                            <p className="font-inter text-sm font-medium text-v3-text-strong">
                              Nothing here yet
                            </p>
                            <p className="mt-1 max-w-[220px] font-inter text-xs text-v3-text-weak">
                              As you chat and save memories, this list becomes a
                              scrapbook—not a verdict.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {filtered.map((insight, i) => {
                              const InsightIcon =
                                INSIGHT_ICONS[insight.category] ?? Sparkles;
                              return (
                                <Card
                                  key={i}
                                  size="sm"
                                  className="rounded-xl border border-v3-stroke-weak bg-v3-fill-weaker/50 px-3.5 py-3 transition-colors duration-150 ease-out hover:border-v3-stroke-strong"
                                >
                                  <div className="flex items-start gap-2.5">
                                    <div className="mt-0.5 rounded-md bg-white/90 p-1.5">
                                      <InsightIcon className="size-3.5 text-v3-icon-neutral" />
                                    </div>
                                    <p className="font-inter text-sm leading-relaxed text-v3-text-strong">
                                      {normalizeObservationForDisplay(
                                        insight.text,
                                      )}
                                    </p>
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </details>
              </div>
            ),
            observations: (
              <section
                aria-labelledby="insights-observations-heading"
                className="space-y-2"
              >
                <h3
                  id="insights-observations-heading"
                  className="font-garamond text-xl font-medium text-v3-text-strong"
                >
                  Observations
                </h3>
                <p className="font-inter text-sm leading-relaxed text-v3-text-weak text-pretty">
                  Your saved observations will appear here as the account
                  reservoir is connected.
                </p>
              </section>
            ),
            explore_next: (
              <section
                aria-labelledby="insights-explore-next-heading"
                className="space-y-2"
              >
                <h3
                  id="insights-explore-next-heading"
                  className="font-garamond text-xl font-medium text-v3-text-strong"
                >
                  Explore next
                </h3>
                <p className="font-inter text-sm leading-relaxed text-v3-text-weak text-pretty">
                  Reflection prompts will appear here when there is a useful
                  next thread to explore.
                </p>
              </section>
            ),
            people: (
              <section
                aria-labelledby="insights-people-heading"
                className="space-y-2"
              >
                <h3
                  id="insights-people-heading"
                  className="font-garamond text-xl font-medium text-v3-text-strong"
                >
                  People
                </h3>
                <p className="font-inter text-sm leading-relaxed text-v3-text-weak text-pretty">
                  The people connected to your Memento will appear here.
                </p>
              </section>
            ),
          }}
        />
      </div>
    </div>
  );
}

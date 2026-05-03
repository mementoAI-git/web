import { useState, useMemo } from "react";
import useSWR from "swr";
import { Heart, ListChecks, Sparkles, Target, UserRound } from "lucide-react";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import { useApi } from "@/hooks/use-api";
import { TimesIcon, PlusIcon } from "@/components/icons";
import endpoint from "@/api/endpoint";
import type { IBeneficiary, IPersona, IUser } from "@/utility/interface";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  ctx: IUser["context"] | Record<string, unknown> | undefined
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

function formatSummaryGeneratedAt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return new Date(t).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const SUMMARY_TAB_KEY = "summary";

const CATEGORIES = [
  { label: "Summary", key: SUMMARY_TAB_KEY },
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
  const [activeCategory, setActiveCategory] = useState(SUMMARY_TAB_KEY);

  const { data: personaRes } = useApi<IPersona | null>(endpoint.persona);
  const {
    data: summaryRes,
    isLoading: summaryLoading,
    error: summaryError,
  } = useApi<MemoryInsightsSummaryDto>(endpoint.personaMemoryInsightsSummary);
  const { data: beneficiariesData } = useSWR(`${endpoint.beneficiaries}?page=1`);
  const { data: contextData } = useSWR(endpoint.userContext);

  const insightSource = useMemo((): MemoryInsightSource => {
    const personaPayload = personaRes?.data;
    if (personaPayload != null) {
      return personaToInsightSource(personaPayload);
    }
    const fromContext = contextData?.data ?? user?.context;
    return userContextToInsightSource(fromContext as Record<string, unknown> | undefined);
  }, [personaRes?.data, contextData?.data, user?.context]);

  const beneficiaries: IBeneficiary[] = beneficiariesData?.data?.docs || [];
  const aiSummary = summaryRes?.data?.summary?.trim() ?? null;
  const summaryUpdatedLabel = formatSummaryGeneratedAt(summaryRes?.data?.generated_at);

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
      : activeCategory === SUMMARY_TAB_KEY
        ? []
        : allInsights.filter((i) => i.category === activeCategory);

  return (
    <div className="bg-white rounded-[24px] w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden shadow-xl">
      <div className="flex items-center justify-between px-6 py-5 border-b border-v3-stroke-weak">
        <h2 className="font-garamond text-2xl font-medium text-v3-text-strong">Memory Insights</h2>
        <Button
          onClick={() => close()}
          variant="ghost"
          size="icon-xs"
          className="size-8 rounded-full bg-v3-fill-weak text-v3-icon-neutral hover:bg-v3-fill-weak/80"
        >
          <TimesIcon width={10} height={10} className="text-v3-icon-neutral" />
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar p-5 space-y-6">
        <div>
          <p className="font-inter text-[11px] font-semibold uppercase tracking-widest text-v3-text-weak mb-4">
            Beneficiaries
          </p>
          {beneficiaries.length === 0 ? (
            <div className="flex items-center gap-4">
              <Button
                onClick={() => open("add-beneficiary")}
                variant="outline"
                size="icon"
                className="size-12 shrink-0 rounded-full border-2 border-dashed border-gray-300 hover:border-v3-brand-strong hover:bg-v3-brand-strong/10"
              >
                <PlusIcon className="size-4 text-v3-icon-neutral" />
              </Button>
              <div>
                <p className="font-inter text-sm font-medium text-v3-text-strong">No beneficiaries yet</p>
                <p className="font-inter text-xs text-v3-text-weak mt-0.5">Add people who can access your Memento.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4 flex-wrap">
              {beneficiaries.slice(0, 5).map((b) => (
                <div key={b._id} className="flex flex-col items-center gap-1.5 w-14">
                  <Avatar className="size-12 bg-v3-fill-weak" size="lg">
                    {b.user?.picture_url ? (
                      <AvatarImage src={b.user.picture_url} alt={b.name} />
                    ) : (
                      <AvatarFallback className="font-inter text-sm font-semibold text-v3-text-strong bg-v3-fill-weak text-v3-text-strong">
                        {getInitials(b.name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="font-inter text-xs font-medium text-v3-text-strong text-center leading-tight truncate w-full text-center">
                    {b.name?.split(" ")[0]}
                  </span>
                  <span className="font-inter text-[10px] text-v3-text-weak text-center capitalize leading-tight">
                    {b.relationship}
                  </span>
                </div>
              ))}

              <div className="flex flex-col items-center gap-1.5 w-14">
                <Button
                  onClick={() => open("add-beneficiary")}
                  variant="outline"
                  size="icon"
                  className="size-12 rounded-full border-2 border-dashed border-gray-300 transition-colors hover:border-v3-brand-strong hover:bg-v3-brand-strong/10"
                >
                  <PlusIcon className="size-4 text-v3-icon-neutral" />
                </Button>
                <span className="font-inter text-xs text-v3-text-weak text-center">Add</span>
              </div>
            </div>
          )}
        </div>

        <Separator className="bg-v3-stroke-weak" />

        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-4 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-4 bg-gradient-to-l from-white to-transparent" />
            <TabsList className="h-auto w-full justify-start gap-1.5 overflow-x-auto rounded-xl bg-v3-fill-weaker p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {CATEGORIES.map((cat) => (
                <TabsTrigger
                  key={cat.key}
                  value={cat.key}
                  className="shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 font-inter text-xs font-medium text-v3-text-weak data-[state=active]:bg-white data-[state=active]:text-v3-text-strong data-[state=active]:shadow-sm"
                >
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>

        <div>
          {activeCategory === SUMMARY_TAB_KEY ? (
            <div className="mt-1">
              {summaryLoading && !aiSummary ? (
                <p className="font-inter text-sm text-v3-text-weak">Crafting your summary…</p>
              ) : summaryError ? (
                <p className="font-inter text-sm text-v3-text-weak">
                  We couldn&apos;t generate your summary right now. Try again in a moment.
                </p>
              ) : aiSummary ? (
                <Card className="rounded-xl border-v3-stroke-weak bg-v3-fill-weak px-4 py-3">
                  <div className="font-inter text-sm text-v3-text-strong leading-relaxed space-y-3">
                    {aiSummary.split("\n\n").map((block, i) => (
                      <p key={i} className="m-0">
                        {block}
                      </p>
                    ))}
                  </div>
                  {summaryUpdatedLabel ? (
                    <p className="mt-2.5 font-inter text-xs text-v3-text-weak">
                      Last updated {summaryUpdatedLabel}
                    </p>
                  ) : null}
                </Card>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-v3-stroke-weak bg-v3-fill-weak/40 py-12 text-center px-4">
                  <div className="size-12 rounded-full bg-v3-fill-weak flex items-center justify-center mb-3">
                    <Sparkles className="size-5 text-v3-icon-neutral" />
                  </div>
                  <p className="font-inter text-sm font-medium text-v3-text-strong">Your summary is being built</p>
                  <p className="font-inter text-xs text-v3-text-weak mt-1 max-w-[220px]">
                    Add memories and chat so we can reflect who you are in your own words.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              <p className="font-inter text-[11px] font-semibold uppercase tracking-widest text-v3-text-weak mb-4">
                {CATEGORIES.find((c) => c.key === activeCategory)?.label}
              </p>

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="size-12 rounded-full bg-v3-fill-weak flex items-center justify-center mb-3">
                    <Sparkles className="size-5 text-v3-icon-neutral" />
                  </div>
                  <p className="font-inter text-sm font-medium text-v3-text-strong">No insights yet</p>
                  <p className="font-inter text-xs text-v3-text-weak mt-1 max-w-[220px]">
                    Keep using Memento — your AI will learn more about you over time.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((insight, i) => {
                    const InsightIcon = INSIGHT_ICONS[insight.category] ?? Sparkles;
                    return (
                      <Card
                        key={i}
                        size="sm"
                        className="rounded-xl border border-v3-stroke-weak bg-v3-fill-weak px-3.5 py-3 transition-colors hover:border-v3-stroke-strong"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 rounded-md bg-white/80 p-1.5">
                            <InsightIcon className="size-3.5 text-v3-icon-neutral" />
                          </div>
                          <p className="font-inter text-sm text-v3-text-strong leading-relaxed">{insight.text}</p>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

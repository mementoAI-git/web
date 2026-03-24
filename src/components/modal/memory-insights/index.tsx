import { useState, useMemo } from "react";
import useSWR from "swr";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import { useApi } from "@/hooks/use-api";
import { TimesIcon, PlusIcon } from "@/components/icons";
import endpoint from "@/api/endpoint";
import { cn } from "@/utility";
import type { IBeneficiary, IPersona, IUser } from "@/utility/interface";

/** Fields used to build summary and category lists (persona + legacy context) */
type MemoryInsightSource = {
  important_notes?: string[];
  key_preferences?: string[];
  conversation_history_summary?: string;
  emotional_state_trends?: string[];
  goals_and_aspirations?: string[];
  self_description?: string;
  join_reasons?: string[];
  /** Persona API: string[]; legacy /users/context: string */
  current_priority?: string | string[];
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

function buildSummaryFromContext(ctx: MemoryInsightSource | undefined): string | null {
  if (!ctx) return null;
  const parts: string[] = [];
  if (ctx.conversation_history_summary?.trim()) {
    parts.push(ctx.conversation_history_summary.trim());
  }
  if (ctx.self_description?.trim()) {
    parts.push(ctx.self_description.trim());
  }
  if (ctx.current_priority) {
    const cp = Array.isArray(ctx.current_priority) ? ctx.current_priority.join(", ") : ctx.current_priority;
    if (cp.trim()) {
      parts.push(`Currently focused on: ${cp.trim()}`);
    }
  }
  const bullets: string[] = [];
  if (ctx.important_notes?.length) bullets.push(...ctx.important_notes);
  if (ctx.key_preferences?.length) bullets.push(...ctx.key_preferences);
  if (ctx.goals_and_aspirations?.length) bullets.push(...ctx.goals_and_aspirations);
  if (ctx.emotional_state_trends?.length) bullets.push(...ctx.emotional_state_trends);
  if (bullets.length) {
    parts.push(bullets.map((b) => `• ${b}`).join("\n"));
  }
  return parts.length ? parts.join("\n\n") : null;
}

const CATEGORIES = [
  { label: "Summary", key: "summary" },
  { label: "All", key: "all" },
  { label: "Key Preferences", key: "key_preferences" },
  { label: "Important Notes", key: "important_notes" },
  { label: "Goals & Aspirations", key: "goals_and_aspirations" },
  { label: "Emotional Trends", key: "emotional_state_trends" },
];

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
  const [activeCategory, setActiveCategory] = useState("summary");

  const { data: personaRes, isLoading: personaLoading } = useApi<IPersona | null>(
    endpoint.persona
  );
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
  const summary = buildSummaryFromContext(insightSource);

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
      : activeCategory === "summary"
        ? []
        : allInsights.filter((i) => i.category === activeCategory);

  return (
    <div className="bg-white rounded-[24px] w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-v3-stroke-weak">
        <h2 className="font-garamond text-2xl font-medium text-v3-text-strong">Memory Insights</h2>
        <button
          onClick={() => close()}
          className="flex items-center justify-center size-8 rounded-full bg-v3-fill-weak hover:opacity-80 transition-colors shrink-0"
        >
          <TimesIcon width={10} height={10} className="text-v3-icon-neutral" />
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-52 shrink-0 border-r border-v3-stroke-weak py-4 px-3 overflow-y-auto bg-v3-fill-weaker">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-xl font-inter text-sm font-medium transition-all mb-1",
                activeCategory === cat.key
                  ? "bg-v3-fill-weak text-v3-text-strong"
                  : "text-v3-text-weak hover:bg-v3-fill-weak hover:text-v3-text-strong"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar p-5 space-y-6">

          {/* Beneficiaries */}
          <div>
            <p className="font-inter text-[11px] font-semibold uppercase tracking-widest text-v3-text-weak mb-4">
              Beneficiaries
            </p>
            {beneficiaries.length === 0 ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => open("add-beneficiary")}
                  className="size-12 shrink-0 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center transition-colors hover:border-v3-brand-strong hover:bg-v3-brand-strong/10"
                >
                  <PlusIcon className="size-4 text-v3-icon-neutral" />
                </button>
                <div>
                  <p className="font-inter text-sm font-medium text-v3-text-strong">No beneficiaries yet</p>
                  <p className="font-inter text-xs text-v3-text-weak mt-0.5">Add people who can access your Memento.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4 flex-wrap">
                {beneficiaries.slice(0, 5).map((b) => (
                  <div key={b._id} className="flex flex-col items-center gap-1.5 w-14">
                    <div className="size-12 rounded-full overflow-hidden bg-v3-fill-weak flex items-center justify-center shrink-0">
                      {b.user?.picture_url ? (
                        <img
                          src={b.user.picture_url}
                          alt={b.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="font-inter text-sm font-semibold text-v3-text-strong">
                          {getInitials(b.name)}
                        </span>
                      )}
                    </div>
                    <span className="font-inter text-xs font-medium text-v3-text-strong text-center leading-tight truncate w-full text-center">
                      {b.name?.split(" ")[0]}
                    </span>
                    <span className="font-inter text-[10px] text-v3-text-weak text-center capitalize leading-tight">
                      {b.relationship}
                    </span>
                  </div>
                ))}

                {/* Add beneficiary */}
                <div className="flex flex-col items-center gap-1.5 w-14">
                  <button
                    onClick={() => open("add-beneficiary")}
                    className="flex size-12 items-center justify-center rounded-full border-2 border-dashed border-gray-300 transition-colors hover:border-v3-brand-strong hover:bg-v3-brand-strong/10"
                  >
                    <PlusIcon className="size-4 text-v3-icon-neutral" />
                  </button>
                  <span className="font-inter text-xs text-v3-text-weak text-center">Add</span>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-v3-stroke-weak" />

          {/* Insights list / Summary */}
          <div>
            <p className="font-inter text-[11px] font-semibold uppercase tracking-widest text-v3-text-weak mb-4">
              {CATEGORIES.find((c) => c.key === activeCategory)?.label}
            </p>

            {personaLoading && activeCategory === "summary" && !summary ? (
              <p className="font-inter text-sm text-v3-text-weak">Loading your persona…</p>
            ) : activeCategory === "summary" ? (
              summary ? (
                <p className="font-inter text-sm text-v3-text-strong whitespace-pre-wrap leading-relaxed">
                  {summary}
                </p>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="size-12 rounded-full bg-v3-fill-weak flex items-center justify-center mb-3">
                    <span className="text-xl">📝</span>
                  </div>
                  <p className="font-inter text-sm font-medium text-v3-text-strong">Your summary is being built</p>
                  <p className="font-inter text-xs text-v3-text-weak mt-1 max-w-[220px]">
                    Add memories and chat to build your personal summary over time.
                  </p>
                </div>
              )
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="size-12 rounded-full bg-v3-fill-weak flex items-center justify-center mb-3">
                  <span className="text-xl">🧠</span>
                </div>
                <p className="font-inter text-sm font-medium text-v3-text-strong">No insights yet</p>
                <p className="font-inter text-xs text-v3-text-weak mt-1 max-w-[220px]">
                  Keep using Memento — your AI will learn more about you over time.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((insight, i) => (
                  <div
                    key={i}
                    className="rounded-[12px] border border-v3-stroke-weak bg-v3-fill-weak px-4 py-3 font-inter text-sm text-v3-text-strong leading-relaxed hover:border-v3-stroke-strong transition-colors"
                  >
                    {insight.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

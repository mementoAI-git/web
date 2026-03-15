import { useState } from "react";
import useSWR from "swr";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import { TimesIcon, PlusIcon } from "@/components/icons";
import endpoint from "@/api/endpoint";
import { cn } from "@/utility";
import type { IBeneficiary, IUser } from "@/utility/interface";

function buildSummaryFromContext(ctx: IUser["context"] | undefined): string | null {
  if (!ctx) return null;
  const parts: string[] = [];
  if (ctx.conversation_history_summary?.trim()) {
    parts.push(ctx.conversation_history_summary.trim());
  }
  if (ctx.self_description?.trim()) {
    parts.push(ctx.self_description.trim());
  }
  if (ctx.current_priority?.trim()) {
    parts.push(`Currently focused on: ${ctx.current_priority.trim()}`);
  }
  if (ctx.join_reasons?.length) {
    parts.push(`Joined Memento to: ${ctx.join_reasons.join(", ")}`);
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

  const { data: beneficiariesData } = useSWR(`${endpoint.beneficiaries}?page=1`);
  const { data: contextData } = useSWR(endpoint.userContext);

  const beneficiaries: IBeneficiary[] = beneficiariesData?.data?.docs || [];
  const ctx = contextData?.data || user?.context || {};
  const summary = buildSummaryFromContext(ctx);

  const allInsights = [
    ...(ctx.important_notes || []).map((text: string) => ({ text, category: "important_notes" })),
    ...(ctx.key_preferences || []).map((text: string) => ({ text, category: "key_preferences" })),
    ...(ctx.goals_and_aspirations || []).map((text: string) => ({ text, category: "goals_and_aspirations" })),
    ...(ctx.emotional_state_trends || []).map((text: string) => ({ text, category: "emotional_state_trends" })),
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
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div>
          <h2 className="font-garamond text-2xl font-medium text-gray-900">Memory Insights</h2>
          <p className="font-inter text-sm text-gray-400 mt-0.5">AI-collected insights about you</p>
        </div>
        <button
          onClick={() => close()}
          className="flex items-center justify-center size-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
        >
          <TimesIcon width={10} height={10} />
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-52 shrink-0 border-r border-gray-100 py-4 px-3 overflow-y-auto bg-gray-50/50">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-xl font-inter text-sm font-medium transition-all mb-1",
                activeCategory === cat.key
                  ? "bg-[#1D2939] text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
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
            <p className="font-inter text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">
              Beneficiaries
            </p>
            {beneficiaries.length === 0 ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => open("add-beneficiary")}
                  className="size-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-[#FF5E00] hover:bg-orange-50 transition-colors shrink-0"
                >
                  <PlusIcon className="size-4 text-gray-400" />
                </button>
                <div>
                  <p className="font-inter text-sm font-medium text-gray-700">No beneficiaries yet</p>
                  <p className="font-inter text-xs text-gray-400 mt-0.5">Add people who can access your Memento.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4 flex-wrap">
                {beneficiaries.slice(0, 5).map((b) => (
                  <div key={b._id} className="flex flex-col items-center gap-1.5 w-14">
                    <div className="size-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                      {b.user?.picture_url ? (
                        <img
                          src={b.user.picture_url}
                          alt={b.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="font-inter text-sm font-semibold text-gray-500">
                          {getInitials(b.name)}
                        </span>
                      )}
                    </div>
                    <span className="font-inter text-xs font-medium text-gray-700 text-center leading-tight truncate w-full text-center">
                      {b.name?.split(" ")[0]}
                    </span>
                    <span className="font-inter text-[10px] text-gray-400 text-center capitalize leading-tight">
                      {b.relationship}
                    </span>
                  </div>
                ))}

                {/* Add beneficiary */}
                <div className="flex flex-col items-center gap-1.5 w-14">
                  <button
                    onClick={() => open("add-beneficiary")}
                    className="size-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-[#FF5E00] hover:bg-orange-50 transition-colors"
                  >
                    <PlusIcon className="size-4 text-gray-400" />
                  </button>
                  <span className="font-inter text-xs text-gray-400 text-center">Add</span>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Insights list / Summary */}
          <div>
            <p className="font-inter text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">
              {CATEGORIES.find((c) => c.key === activeCategory)?.label}
            </p>

            {activeCategory === "summary" ? (
              summary ? (
                <p className="font-inter text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {summary}
                </p>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="size-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <span className="text-xl">📝</span>
                  </div>
                  <p className="font-inter text-sm font-medium text-gray-500">Your summary is being built</p>
                  <p className="font-inter text-xs text-gray-400 mt-1 max-w-[220px]">
                    Add memories and chat to build your personal summary over time.
                  </p>
                </div>
              )
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="size-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <span className="text-xl">🧠</span>
                </div>
                <p className="font-inter text-sm font-medium text-gray-500">No insights yet</p>
                <p className="font-inter text-xs text-gray-400 mt-1 max-w-[220px]">
                  Keep using Memento — your AI will learn more about you over time.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((insight, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-gray-100 px-4 py-3 font-inter text-sm text-gray-700 leading-relaxed hover:border-gray-200 transition-colors"
                    style={{ backgroundColor: "#FAFAFA" }}
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

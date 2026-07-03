/* eslint-disable react-refresh/only-export-components -- hooks exported next to modal/block components */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import type { UserStatsData } from "@/features/enrichment/enrichment-api.types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export type NarrativeInsightSourceKind = "memory" | "enrichment" | "chat" | "note";

export interface NarrativeInsightSource {
  id: string;
  kind: NarrativeInsightSourceKind;
  label: string;
  detail: string;
  href?: string;
}

export interface NarrativeInsight {
  id: string;
  headline: string;
  teaser: string;
  fullNarrative: string;
  sources: NarrativeInsightSource[];
}

function teaserFrom(text: string, max = 160): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Human-facing “insights” derived from stats (spotlight, nudge, dimension mirror).
 * Richer server-generated narratives can replace/extend this later.
 */
export function useNarrativeInsights(): NarrativeInsight[] {
  const { data } = useSWR<{ data: UserStatsData }>(endpoint.userStats);
  const stats = data?.data;

  return useMemo(() => {
    if (!stats) return [];

    const out: NarrativeInsight[] = [];
    const score = Math.round(Number(stats.enrichment_score) || 0);
    const spotlight = stats.spotlight;

    if (spotlight?.excerpt) {
      const href =
        spotlight.source === "conversation"
          ? `/chat/${spotlight.memory_id}`
          : `/stories/${spotlight.memory_id}`;
      const titlePart = spotlight.title ? `“${spotlight.title}”` : "This moment";
      const teaser = spotlight.title
        ? `${titlePart} — ${teaserFrom(spotlight.excerpt, 140)}`
        : teaserFrom(spotlight.excerpt, 180);
      const prov =
        spotlight.source === "conversation"
          ? "Pulled from your conversation summary—not a raw transcript."
          : "Pulled from a story you saved.";
      out.push({
        id: "insight-spotlight",
        headline: "Something vivid right now",
        teaser,
        fullNarrative: `${titlePart} is one of the threads Memento can see most clearly right now. ${prov} You can open it anytime to add detail or soften the wording.`,
        sources: [
          {
            id: "src-memory",
            kind: spotlight.source === "conversation" ? "chat" : "memory",
            label: spotlight.source === "conversation" ? "Conversation" : "Story memory",
            detail: spotlight.excerpt,
            href,
          },
          {
            id: "src-breadth",
            kind: "enrichment",
            label: "Breadth snapshot",
            detail: `About ${score}% overall—numbers stay in the background so your words stay in front.`,
          },
        ],
      });
    }

    if (stats.nudge?.question && stats.nudge.category_label) {
      const { category_label, question } = stats.nudge;
      out.push({
        id: "insight-territory",
        headline: "Unexplored territory",
        teaser: `${category_label} is a quieter chapter right now—there’s room to wander, not a hole to fix.`,
        fullNarrative: `We’re not tracking “missing data.” We’re noticing where your story still has open sky. ${category_label} is one of those spaces. ${question}`,
        sources: [
          {
            id: "src-dimension",
            kind: "enrichment",
            label: "Life dimension",
            detail: category_label,
          },
          {
            id: "src-nudge",
            kind: "note",
            label: "Invitation",
            detail: question,
          },
          ...(stats.jump_pills?.[0]
            ? [
                {
                  id: "src-chat",
                  kind: "chat" as const,
                  label: "Host chat",
                  detail: `Starter: ${stats.jump_pills[0].starter}`,
                  href: "/chat",
                },
              ]
            : []),
        ],
      });
    }

    const scores = stats.category_scores ?? [];
    const unlocked = scores.filter((c) => c.unlocked);
    const withItems = [...unlocked].filter((c) => c.itemCount > 0);
    const top =
      withItems.length > 0
        ? [...withItems].sort((a, b) => b.itemCount - a.itemCount || b.score - a.score)[0]
        : null;
    const lowKey = stats.lowest_category;
    const low = lowKey ? unlocked.find((c) => c.key === lowKey) : null;

    if (
      top &&
      low &&
      top.key !== low.key &&
      top.itemCount >= 1
    ) {
      out.push({
        id: "insight-mirror",
        headline: "How your story is tilting",
        teaser: `You’ve been sharing more in ${top.label}; ${low.label} still has breathing room—that’s space, not a deficit.`,
        fullNarrative: `Think of this as a mirror, not a report. ${top.label} has gathered more texture lately (${top.itemCount} signal${top.itemCount === 1 ? "" : "s"}). ${low.label} is softer right now (${low.itemCount} signal${low.itemCount === 1 ? "" : "s"})—that’s an invitation to wander there when you’re ready, not a grade.`,
        sources: [
          {
            id: "src-top",
            kind: "enrichment",
            label: top.label,
            detail: `${top.itemCount} contributing signal(s); score about ${Math.round(top.score)}%.`,
          },
          {
            id: "src-low",
            kind: "enrichment",
            label: low.label,
            detail: `${low.itemCount} contributing signal(s); score about ${Math.round(low.score)}%.`,
          },
        ],
      });
    }

    return out.slice(0, 3);
  }, [stats]);
}

export function NarrativeInsightsBlock({ insights }: { insights: NarrativeInsight[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const selected = insights.find((i) => i.id === openId) ?? null;

  if (insights.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-v3-stroke-weak bg-v3-fill-weaker/40 px-4 py-6 font-inter text-sm leading-relaxed text-v3-text-weak text-pretty">
        Narrative insights will appear here as you save memories and chat—your Memento will mirror the growth back
        to you, not just the completion percent.
      </p>
    );
  }

  return (
    <>
      <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-1">
        {insights.map((ins) => (
          <Card
            key={ins.id}
            className="flex w-[min(100%,20rem)] min-w-[min(100%,18rem)] shrink-0 flex-col gap-3 rounded-2xl border border-v3-stroke-weak bg-white p-4 shadow-none"
          >
            <p className="font-garamond text-lg font-medium leading-snug text-v3-text-strong text-pretty">
              {ins.headline}
            </p>
            <p className="font-inter text-sm leading-relaxed text-v3-text-weak text-pretty">{ins.teaser}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-auto w-fit rounded-xl border-v3-stroke-weak font-inter text-xs font-semibold transition-transform duration-150 ease-out active:scale-[0.98]"
              onClick={() => setOpenId(ins.id)}
            >
              View
            </Button>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent
          showCloseButton
          className="max-h-[85vh] overflow-y-auto border border-v3-stroke-weak bg-white text-v3-text-strong ring-v3-stroke-weak sm:max-w-lg"
        >
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-garamond text-xl font-medium text-v3-text-strong">
                  {selected.headline}
                </DialogTitle>
              </DialogHeader>
              <p className="font-inter text-sm leading-relaxed text-v3-text-strong text-pretty">
                {selected.fullNarrative}
              </p>
              <Separator className="bg-v3-stroke-weak" />
              <div className="space-y-3">
                <p className="font-inter text-[11px] font-semibold uppercase tracking-widest text-v3-text-weaker">
                  Sources
                </p>
                <ul className="space-y-3">
                  {selected.sources.map((s) => (
                    <li key={s.id} className="rounded-xl border border-v3-stroke-weak bg-v3-fill-weaker/50 p-3">
                      <p className="font-inter text-xs font-semibold text-v3-text-strong">{s.label}</p>
                      <p className="mt-1 font-inter text-xs leading-relaxed text-v3-text-weak text-pretty">
                        {s.detail}
                      </p>
                      {s.href ? (
                        <Button variant="link" className="mt-2 h-auto p-0 font-inter text-xs" asChild>
                          <Link to={s.href}>Open linked place</Link>
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

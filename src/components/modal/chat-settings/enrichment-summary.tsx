import { CalendarDays, ChevronRight, FileText, Film, Image, Link2, Music2, Route, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import type { CategoryScore } from "@/features/enrichment";
import type { EnrichmentCategory } from "@/features/enrichment/enrichment-categories";
import type { ConversationFilesRequest } from "@/pages/dashboard/chat/conversation/conversation-assets";

const shortcuts = [
  { label: "Images", icon: Image, request: { tab: "media", mediaFilter: "images" } },
  { label: "Videos", icon: Film, request: { tab: "media", mediaFilter: "videos" } },
  { label: "Audio", icon: Music2, request: { tab: "media", mediaFilter: "audio" } },
  { label: "Docs", icon: FileText, request: { tab: "docs" } },
  { label: "Links", icon: Link2, request: { tab: "links" } },
] as const;

const lifeAreaSegments: ReadonlyArray<{
  key: EnrichmentCategory;
  label: string;
  colorClass: string;
}> = [
  { key: "memories_experiences", label: "Memories & Experiences", colorClass: "bg-[var(--life-area-memories-experiences)]" },
  { key: "heritage_roots", label: "Heritage & Roots", colorClass: "bg-[var(--life-area-heritage-roots)]" },
  { key: "lessons_wisdom", label: "Lessons & Wisdom", colorClass: "bg-[var(--life-area-lessons-wisdom)]" },
  { key: "relationships_people", label: "Relationships & People", colorClass: "bg-[var(--life-area-relationships-people)]" },
  { key: "beliefs_worldview", label: "Beliefs & Worldview", colorClass: "bg-[var(--life-area-beliefs-worldview)]" },
  { key: "passions_interests", label: "Passions & Interests", colorClass: "bg-[var(--life-area-passions-interests)]" },
  { key: "hopes_legacy", label: "Hopes & Legacy", colorClass: "bg-[var(--life-area-hopes-legacy)]" },
  { key: "work_purpose", label: "Work & Purpose", colorClass: "bg-[var(--life-area-work-purpose)]" },
  { key: "everyday_life", label: "Everyday Life", colorClass: "bg-[var(--life-area-everyday-life)]" },
  { key: "identity_self", label: "Identity & Self", colorClass: "bg-[var(--life-area-identity-self)]" },
];

function enrichmentStrength(score: number) {
  if (score >= 70) return "Strong";
  if (score >= 35) return "Medium";
  return "Weak";
}

export function EnrichmentSummary({
  score = 0,
  categoryScores = [],
  onOpenFiles,
}: {
  score?: number;
  categoryScores?: CategoryScore[] | null;
  onOpenFiles?: (request: ConversationFilesRequest) => void;
}) {
  const strength = enrichmentStrength(score);
  const scoreByCategory = new Map(
    (categoryScores ?? []).map((category) => [category.key, Math.max(0, category.score)]),
  );
  const hasLifeAreaScores = lifeAreaSegments.some(
    ({ key }) => (scoreByCategory.get(key) ?? 0) > 0,
  );
  const weakest = [...(categoryScores ?? [])].sort((a, b) => a.score - b.score).slice(0, 1);
  const insights = [
    { title: "Missing places", body: "Share the places that shaped you and the memories connected to them.", icon: Route },
    { title: "People/relationships", body: "Add more about the people who matter and how those relationships changed you.", icon: UsersRound },
    ...(weakest.length ? [{ title: weakest[0]!.label, body: "This life area has room for more context and detail.", icon: CalendarDays }] : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl bg-background p-3">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="font-geist text-base font-semibold text-text-neutral-strong">My Enrichment score</h2>
            <p className="mt-1 font-geist text-sm leading-5 text-text-neutral-weak">
              Your Enrichment score reflects your memory health across 10 key life areas.
            </p>
          </div>
          <p className="shrink-0 font-garamond text-4xl leading-none text-text-neutral-strong">{strength}</p>
        </div>
        <div
          className="mt-4 flex h-6 overflow-hidden rounded-sm bg-fill-neutral-weaker"
          role="img"
          aria-label={`Life area enrichment distribution. Overall enrichment is ${strength}.`}
        >
          {lifeAreaSegments.map(({ key, label, colorClass }) => {
            const categoryScore = scoreByCategory.get(key) ?? 0;
            return (
              <span
                key={key}
                data-life-area={key}
                className={`h-full min-w-0 basis-0 ${colorClass}`}
                style={{ flexGrow: hasLifeAreaScores ? categoryScore : 1 }}
                title={`${label}: ${categoryScore}%`}
                aria-hidden
              />
            );
          })}
        </div>
        <Link to="/settings/general?view=stats" className="mt-4 flex items-center gap-2 font-geist text-sm text-text-neutral-strong no-underline">
          <span className="flex-1">Discover which areas need more context</span>
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </section>

      <nav aria-label="Media shortcuts" className="grid grid-cols-5 gap-1">
        {shortcuts.map(({ label, icon: Icon, request }) => (
          <button type="button" key={label} onClick={() => onOpenFiles?.(request)} aria-label={label} className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl bg-fill-neutral-weaker px-1 py-2 text-center font-geist text-xs text-text-neutral-strong no-underline transition-[transform,background-color] duration-150 hover:bg-fill-neutral-weak active:scale-[0.97]">
            <Icon className="size-5" strokeWidth={1.75} aria-hidden />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </nav>

      <section>
        <h2 className="font-geist text-base font-semibold text-text-neutral-strong">Deep dive insights</h2>
        <div className="-mx-1 mt-3 flex snap-x gap-3 overflow-x-auto px-1 pb-1 scrollbar-hide" tabIndex={0} aria-label="Deep dive insights">
          {insights.map(({ title, body, icon: Icon }) => (
            <article key={title} className="w-48 shrink-0 snap-start rounded-xl border border-stroke-neutral-weak bg-background p-3">
              <h3 className="flex items-center gap-2 font-geist text-sm font-semibold text-text-neutral-strong">
                <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                <span className="min-w-0 flex-1 line-clamp-1">{title}</span>
              </h3>
              <p className="mt-2 line-clamp-3 font-geist text-sm leading-5 text-text-neutral-weak">{body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

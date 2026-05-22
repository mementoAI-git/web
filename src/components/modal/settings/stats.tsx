import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal";
import { AtAGlanceCard, useAtAGlanceCards } from "@/features/enrichment/at-a-glance-cards";
import { NarrativeInsightsBlock, useNarrativeInsights } from "@/features/enrichment/narrative-insights";

export interface StatsProps {
  /** When true, omit the page-level title (e.g. nested under Personal info sub-tabs). */
  embedded?: boolean;
}

/** Settings Stats tab: narrative insights + at-a-glance activity strip. */
export default function Stats({ embedded = false }: StatsProps) {
  const { open } = useModal();
  const atAGlance = useAtAGlanceCards();
  const narrativeInsights = useNarrativeInsights();

  return (
    <div className={embedded ? "flex w-full flex-col" : "flex w-full flex-col gap-6"}>
      {!embedded ? (
        <header className="flex min-w-0 flex-col gap-1">
          <span className="font-inter text-base font-bold text-v3-text-strong text-balance">Stats</span>
          <span className="font-inter text-sm text-v3-text-weak text-pretty">
            Highlights from your activity and how your Memento is growing.
          </span>
        </header>
      ) : null}

      <div className="flex w-full flex-col gap-8 rounded-2xl border border-v3-stroke-weak bg-white p-6">
        <section className="flex flex-col gap-3" aria-labelledby="settings-stats-narrative-heading">
          <p
            id="settings-stats-narrative-heading"
            className="font-inter text-[11px] font-semibold uppercase tracking-widest text-v3-text-weaker"
          >
            Insights
          </p>
          <NarrativeInsightsBlock insights={narrativeInsights} />
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="settings-stats-glance-heading">
          <p
            id="settings-stats-glance-heading"
            className="font-inter text-[11px] font-semibold uppercase tracking-widest text-v3-text-weaker"
          >
            At a glance
          </p>
          <p className="font-inter text-xs text-v3-text-weak text-pretty">
            Quick numbers—mirrors and invitations live above.
          </p>
          <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-1">
            {atAGlance.map((card, i) => (
              <AtAGlanceCard key={i} {...card} />
            ))}
          </div>
        </section>

        <div className="flex gap-3">
          <Button
            asChild
            variant="outline"
            className="flex-1 rounded-lg !border !border-v3-stroke-weak font-inter text-sm font-semibold text-v3-text-strong hover:!bg-v3-fill-strong hover:!text-white"
          >
            <Link to="/onboarding/misc?mode=revisit">Update my story</Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => open("memory-insights")}
            className="flex-1 rounded-lg !border !border-v3-stroke-weak font-inter text-sm font-semibold text-v3-text-strong hover:!bg-v3-fill-strong hover:!text-white"
          >
            See full insights
          </Button>
        </div>
      </div>
    </div>
  );
}

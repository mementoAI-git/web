import { useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import useSWR from "swr";
import { Clock, TrendingUp, BookOpen, Star } from "lucide-react";
import { cn } from "@/utility";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import endpoint from "@/api/endpoint";

interface InsightCardData {
  icon: ReactNode;
  iconBg: string;
  title: string;
  body: ReactNode;
}

function InsightCard({ icon, iconBg, title, body }: InsightCardData) {
  return (
    <div className="flex w-60 min-w-60 sm:w-64 sm:min-w-64 flex-col gap-3 rounded-2xl border border-v3-stroke-weak bg-white p-4">
      <div className="flex items-center gap-3">
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", iconBg)}>
          {icon}
        </div>
        <p className="font-inter text-sm font-semibold leading-tight text-v3-text-strong line-clamp-2">{title}</p>
      </div>
      <p className="font-inter text-xs leading-relaxed text-v3-text-weak flex-1">{body}</p>
    </div>
  );
}

/** Settings Stats tab: insight cards driven by user stats and memory counts. */
export default function Stats() {
  const { open } = useModal();
  const { user } = useStore();
  const { data: statsData } = useSWR(endpoint.userStats);
  const { data: memoriesStatsData } = useSWR(endpoint.memoriesStats);

  const stats = statsData?.data ?? {};
  const enrichmentScore = Number(stats.enrichment_score) || 0;
  const streakCount = Number(user?.streak) || Number(stats.streak_count) || 0;
  const memoriesCount =
    memoriesStatsData?.data?.stories_count ?? memoriesStatsData?.stories_count ?? 0;
  const topDimension: string | null = stats.top_dimension ?? null;

  const insightCards: InsightCardData[] = useMemo(
    () => [
      {
        icon: <Clock size={16} strokeWidth={1.5} className="text-amber-600" />,
        iconBg: "bg-amber-50",
        title:
          enrichmentScore > 50 ? "You're building a rich Memento" : "Your Memento journey is beginning",
        body:
          enrichmentScore < 50
            ? "Each story you add deepens the picture you leave behind."
            : "More than halfway there. Keep going.",
      },
      {
        icon: <TrendingUp size={16} strokeWidth={1.5} className="text-emerald-600" />,
        iconBg: "bg-emerald-50",
        title: topDimension ? `"${topDimension}" leads your story` : "Explore new dimensions",
        body: topDimension ? (
          <>
            <strong className="font-semibold text-v3-text-strong">{topDimension}</strong> has the most
            entries. Branch into other dimensions to round out your Memento.
          </>
        ) : (
          "Some life dimensions have no entries yet. Start there."
        ),
      },
      {
        icon: <BookOpen size={16} strokeWidth={1.5} className="text-blue-600" />,
        iconBg: "bg-blue-50",
        title:
          memoriesCount > 0
            ? `${memoriesCount} ${memoriesCount === 1 ? "memory" : "memories"} captured`
            : "Start capturing memories",
        body:
          memoriesCount > 0 ? (
            <>
              <strong className="font-semibold text-v3-text-strong">{memoriesCount}</strong>{" "}
              {memoriesCount === 1 ? "memory" : "memories"} logged. Every entry enriches what you leave
              behind.
            </>
          ) : (
            "Your first entry is the hardest. Start small."
          ),
      },
      {
        icon: <Star size={16} strokeWidth={1.5} className="text-purple-600" />,
        iconBg: "bg-purple-50",
        title:
          streakCount > 0 ? `${streakCount}-day active streak` : "Start your streak today",
        body:
          streakCount > 0 ? (
            <>
              <strong className="font-semibold text-v3-text-strong">{streakCount} days</strong> in a row.
              Consistent reflection builds the richest Mementos.
            </>
          ) : (
            "Add an entry today to start your streak."
          ),
      },
    ],
    [enrichmentScore, memoriesCount, streakCount, topDimension],
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex min-w-0 flex-col gap-1">
        <span className="font-inter text-base font-bold text-v3-text-strong text-balance">Stats</span>
        <span className="font-inter text-sm text-v3-text-weak text-pretty">Highlights from your activity and how your Memento is growing.</span>
      </header>

      <div className="flex w-full flex-col rounded-2xl border border-v3-stroke-weak bg-white p-6">
      <section className="flex flex-col gap-3" aria-labelledby="settings-stats-insights-heading">
        <p
          id="settings-stats-insights-heading"
          className="font-inter text-[11px] font-semibold uppercase tracking-widest text-v3-text-weaker"
        >
          Your insights
        </p>
        <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-1">
          {insightCards.map((card, i) => (
            <InsightCard key={i} {...card} />
          ))}
        </div>
        <div className="flex gap-3">
          <Button
            asChild
            variant="outline"
            className="flex-1 rounded-lg !border !border-v3-stroke-weak font-inter text-sm font-semibold text-v3-text-strong hover:!bg-v3-fill-strong hover:!text-white"
          >
            <Link to="/onboard/misc">Update my story</Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => open("memory-insights")}
            className="flex-1 rounded-lg !border !border-v3-stroke-weak font-inter text-sm font-semibold text-v3-text-strong hover:!bg-v3-fill-strong hover:!text-white"
          >
            See full insights
          </Button>
        </div>
      </section>
      </div>
    </div>
  );
}

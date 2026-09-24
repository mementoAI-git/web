import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const INSIGHTS_OVERLAY_SECTIONS = [
  { value: "general", label: "General" },
  { value: "observations", label: "Observations" },
  { value: "explore_next", label: "Explore next" },
  { value: "people", label: "People" },
] as const;

type InsightsOverlaySection =
  (typeof INSIGHTS_OVERLAY_SECTIONS)[number]["value"];

interface InsightsOverlayNavigationProps {
  content: Record<InsightsOverlaySection, ReactNode>;
}

/**
 * Shared, accessible navigation frame for the member-facing Insights overlay.
 * Each section owns its content so data work can land independently.
 */
export function InsightsOverlayNavigation({
  content,
}: InsightsOverlayNavigationProps) {
  return (
    <Tabs
      defaultValue="general"
      orientation="vertical"
      className="min-h-0 flex-1 gap-5 md:flex-row"
    >
      <aside className="shrink-0 md:w-40">
        <TabsList
          aria-label="Insights sections"
          className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-v3-fill-weaker p-1 md:flex-col md:items-stretch md:overflow-visible"
        >
          {INSIGHTS_OVERLAY_SECTIONS.map((section) => (
            <TabsTrigger
              key={section.value}
              value={section.value}
              className="h-auto shrink-0 justify-start rounded-lg px-3 py-2 font-inter text-sm text-v3-text-weak data-active:bg-white data-active:text-v3-text-strong data-active:shadow-sm"
            >
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </aside>

      <div className="min-w-0 flex-1">
        {INSIGHTS_OVERLAY_SECTIONS.map((section) => (
          <TabsContent
            key={section.value}
            value={section.value}
            className="mt-0"
          >
            {content[section.value]}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}

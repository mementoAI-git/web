import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const sections = [
  { value: "observations", label: "Observations" },
  { value: "insights", label: "Insights" },
  { value: "preferences", label: "Preferences" },
  { value: "enrichment", label: "Enrichment fields" },
] as const;
export type InsightsSection = (typeof sections)[number]["value"];

export function InsightsOverlayNavigation({
  value,
  onValueChange,
  content,
}: {
  value: InsightsSection;
  onValueChange: (value: InsightsSection) => void;
  content: Record<InsightsSection, ReactNode>;
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onValueChange(next as InsightsSection)}
      className="min-w-0 flex-col gap-6"
    >
      <div className="overflow-x-auto pb-1">
        <TabsList
          aria-label="Insights sections"
          aria-orientation="horizontal"
          className="insights-tabs"
        >
          {sections.map((section) => (
            <TabsTrigger
              key={section.value}
              value={section.value}
              className="insights-tab"
            >
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {sections.map((section) => (
        <TabsContent key={section.value} value={section.value} className="mt-0">
          {content[section.value]}
        </TabsContent>
      ))}
    </Tabs>
  );
}

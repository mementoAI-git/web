import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const sections = [
  { value: "all", label: "All" },
  { value: "about", label: "About me" },
  { value: "observations", label: "Observations" },
  { value: "preferences", label: "Preferences" },
  { value: "enrichment", label: "Enrichment score" },
] as const;
type Section = (typeof sections)[number]["value"];

export function InsightsOverlayNavigation({
  content,
}: {
  content: Record<Section, ReactNode>;
}) {
  return (
    <Tabs defaultValue="observations" className="min-w-0 gap-7">
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

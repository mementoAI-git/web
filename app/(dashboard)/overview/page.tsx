import { PromtProvider } from "@/hooks/use-prompt";
import Overview from "@/views/Overview";

export default function OverviewPage() {
  return (
    <PromtProvider>
      <Overview />
    </PromtProvider>
  )
}
import { PromtProvider } from "@/hooks/use-prompt";
import Overview from "@/views/Overview";

export default function OverviewPage() {
  return (
    <PromtProvider>
      <div className="w-[93%] mx-auto">
        <Overview />
      </div>
    </PromtProvider>
  )
}
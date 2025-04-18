import { PromtProvider } from "@/hooks/use-prompt";
import Overview from "@/views/Overview";

export default function OverviewPage() {
  return (
    <PromtProvider>
      <div className="mx-auto w-[93%]">
        <Overview />
      </div>
    </PromtProvider>
  );
}

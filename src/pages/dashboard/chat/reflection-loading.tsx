import TopicHeader from "./conversation/topic-header";
import Spinner from "@/components/spinner";
import type { ReflectionEntry } from "@/lib/reflection-entry";
import type { IMemory } from "@/utility/interface";

export default function ReflectionLoading({
  entry,
  children,
}: {
  entry: ReflectionEntry;
  children?: React.ReactNode;
}) {
  const memory = {
    _id: "",
    title: entry.question,
    prompt_text: entry.question,
    prompt_type: entry.request.prompt_type,
    category: entry.category,
  } as IMemory;
  return (
    <div className="flex min-h-0 min-w-0 flex-1 justify-center overflow-y-auto">
      <div className="w-full min-w-0 max-w-[810px] px-3 pt-3 sm:px-0">
        <TopicHeader memory={memory} />
        {children || (
          <div
            role="status"
            aria-label="Opening reflection"
            className="flex items-center justify-center gap-2 py-8 text-sm text-text-neutral-weak"
          >
            <Spinner loading />
            Opening reflection…
          </div>
        )}
      </div>
    </div>
  );
}

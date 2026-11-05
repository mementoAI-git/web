import type { IMemory } from "@/utility/interface";
export function storyDestination(memory: Pick<IMemory, "_id" | "prompt_type">) {
  return memory.prompt_type
    ? `/chat/reflection/${memory._id}`
    : `/stories/${memory._id}`;
}

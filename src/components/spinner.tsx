import { cn } from "@/utility";
import { Spinner as UiSpinner } from "@/components/ui/spinner";

/**
 * Legacy wrapper: hides until `loading` is true (call sites use `loading={isMutating}`).
 * Renders shadcn/ui Spinner (Loader2) when visible.
 */
export default function Spinner({
  loading = false,
  className = "",
}: {
  loading?: boolean;
  className?: string;
}) {
  if (!loading) {
    return null;
  }
  return <UiSpinner className={cn("mr-3 -ml-1 size-5 text-white", className)} />;
}

import { toast } from "sonner";

/** postFetcher already toasts its normalized transport failures. */
export function reportFetcherError(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "success" in error && error.success === false && "httpStatus" in error) return;
  toast.error(error instanceof Error ? error.message : fallback);
}

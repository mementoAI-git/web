import Spinner from "@/components/spinner";
import { AuthSplitShell } from "@/components/auth-split-layout";
import { cn } from "@/lib/utils";

export function AuthLoader({
  title,
  embedded = false,
  className,
}: {
  title: string;
  /** When true, only the inner card (use inside an existing {@link AuthSplitShell}). */
  embedded?: boolean;
  className?: string;
}) {
  const inner = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-6 rounded-2xl border border-v3-stroke-weak bg-v3-bg px-8 py-12 shadow-sm",
        className,
      )}
    >
      <Spinner loading className="!size-16 !text-primary sm:!size-20" />
      <p className="text-center font-garamond text-lg text-v3-text-strong sm:text-xl">{title}</p>
    </div>
  );

  if (embedded) {
    return inner;
  }

  return <AuthSplitShell>{inner}</AuthSplitShell>;
}

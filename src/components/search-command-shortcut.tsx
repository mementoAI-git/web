import { cn } from "@/lib/utils";

interface SearchCommandShortcutProps {
  className?: string;
}

export function SearchCommandShortcut({
  className,
}: SearchCommandShortcutProps) {
  return (
    <span
      data-slot="search-command-shortcut"
      className={cn("inline-flex items-center gap-1", className)}
      aria-hidden
    >
      <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-inter text-[10px] font-medium text-foreground">
        &#8984;
      </kbd>
      <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-inter text-[10px] font-medium text-foreground">
        K
      </kbd>
    </span>
  );
}

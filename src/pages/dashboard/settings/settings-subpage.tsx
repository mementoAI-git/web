import type { ReactNode } from "react";
import { Undo2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function SettingsSubpage({
  title,
  backTo = "/settings",
  backLabel = "Back to settings",
  children,
}: {
  title: ReactNode;
  backTo?: string;
  backLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-10">
      <div className="insights-page-heading">
        <Button
          asChild
          variant="ghost"
          size="icon-lg"
          className="insights-round-button"
        >
          <Link to={backTo} aria-label={backLabel}>
            <Undo2 aria-hidden />
          </Link>
        </Button>
        <h2 className="min-w-0 break-words font-garamond text-4xl text-text-neutral-strong">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

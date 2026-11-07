import type { CSSProperties, ReactNode } from "react";
import { Undo2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/pages/dashboard/component/page-heading";

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
      <div className="insights-page-heading page-rise page-rise--heading">
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
        <PageHeading className="break-words">{title}</PageHeading>
      </div>
      <div className="page-stagger flex flex-col gap-10" style={{ "--page-stagger-start": 1 } as CSSProperties}>
        {children}
      </div>
    </div>
  );
}

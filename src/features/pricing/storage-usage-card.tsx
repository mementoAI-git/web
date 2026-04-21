import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import type { SubscriptionUsage } from "./types";

const FREE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024;
const PRO_LIMIT_BYTES = 100 * 1024 * 1024 * 1024;

function formatBytes(n: number) {
  if (n >= 1024 * 1024 * 1024) return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (n >= 1024 * 1024) return `${Math.round(n / (1024 * 1024))} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

type StorageUsageCardProps = {
  usage: SubscriptionUsage | undefined;
  isProOrAbove: boolean;
  className?: string;
};

export function StorageUsageCard({ usage, isProOrAbove, className }: StorageUsageCardProps) {
  const navigate = useNavigate();
  const used = usage?.storage_used_bytes ?? 0;
  const limit =
    usage?.storage_limit_bytes ??
    (isProOrAbove ? PRO_LIMIT_BYTES : FREE_LIMIT_BYTES);

  const pct = useMemo(() => {
    if (limit <= 0) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
  }, [used, limit]);

  const nearFull = pct >= 85;

  return (
    <Card
      size="sm"
      className={cn(
        "border-v3-stroke-weak bg-gradient-to-br from-card to-v3-fill-weaker/30 ring-v3-stroke-weak/80",
        className,
      )}
    >
      <CardHeader className="gap-1 pb-2">
        <CardTitle className="font-garamond text-lg text-v3-text-strong">Storage</CardTitle>
        <CardDescription className="font-inter text-v3-text-weak">
          {isProOrAbove ?
            "Your plan includes substantially more space for memories and media."
          : "Free plan includes 5 GB. Upgrade for 100 GB or unlimited on Legacy."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2 font-inter text-sm">
          <span className={cn("tabular-nums text-v3-text-strong", nearFull && "font-semibold text-amber-900")}>
            {formatBytes(used)} used
          </span>
          <span className="text-muted-foreground tabular-nums">
            of {formatBytes(limit)}
          </span>
        </div>
        <Progress
          value={pct}
          className={cn("h-2", nearFull && "[&_[data-slot=progress-indicator]]:bg-amber-600")}
        />
      </CardContent>
      {!isProOrAbove ? (
        <CardFooter className="pt-0">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="rounded-full font-inter"
            onClick={() => navigate("/pricing")}
          >
            Get more storage
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}

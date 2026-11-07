import { useMemo, useState } from "react";

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
import { UpgradePrompt } from "./upgrade-prompt";

import type { SubscriptionUsage } from "./types";
import { formatBytes, FREE_LIMIT_BYTES, PRO_LIMIT_BYTES } from "./storage-display";

type StorageUsageCardProps = {
  usage: SubscriptionUsage | undefined;
  isProOrAbove: boolean;
  className?: string;
  variant?: "default" | "billing";
};

export function StorageUsageCard({
  usage,
  isProOrAbove,
  className,
  variant = "default",
}: StorageUsageCardProps) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const used = usage?.storage_used_bytes ?? 0;
  const reserved = usage?.storage_reserved_bytes ?? 0;
  const limit =
    usage?.storage_limit_bytes ??
    (isProOrAbove ? PRO_LIMIT_BYTES : FREE_LIMIT_BYTES);

  const pct = useMemo(() => {
    const occupiedPercent =
      limit > 0 ? Math.round(((used + reserved) / limit) * 100) : 0;
    if (typeof usage?.percent_used === "number") {
      return Math.min(100, Math.max(0, usage.percent_used, occupiedPercent));
    }
    if (limit <= 0) return 0;
    return Math.min(100, occupiedPercent);
  }, [usage?.percent_used, used, reserved, limit]);

  const remaining =
    usage?.remaining_bytes ?? Math.max(0, limit - used - reserved);
  const overLimit = usage?.over_limit ?? used > limit;
  const full = overLimit || remaining <= 0 || pct >= 100;
  const nearFull = full || pct >= 80;
  const warning = full
    ? isProOrAbove
      ? "Storage is full. Remove some files or contact support before uploading more."
      : "Storage is full. Remove some files or upgrade before uploading more."
    : nearFull
      ? "You’re running low on storage. Clear some space before your next upload."
      : null;

  if (variant === "billing") {
    return (
      <section
        aria-label="Storage"
        className={cn(
          "settings-card flex flex-col gap-2 p-4 font-geist sm:p-6",
          className,
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <h3 className="font-semibold text-text-neutral-strong">Storage</h3>
          <span className="tabular-nums text-text-neutral-weak">
            {formatBytes(used)} / {formatBytes(limit)} Used
          </span>
        </div>
        <Progress
          value={pct}
          aria-valuenow={pct}
          aria-label="Storage used"
          className="h-3 rounded-none bg-bg-neutral [&_[data-slot=progress-indicator]]:bg-fill-brand-strong"
        />
        <p className="text-xs text-text-neutral-weak">
          {formatBytes(remaining)} Available
          {reserved > 0 ? ` · ${formatBytes(reserved)} uploading` : ""}
        </p>
        {warning ? (
          <p role="alert" className="text-xs text-text-warning-strong">
            {warning}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <Card
      size="sm"
      className={cn(
        "sky-card border-stroke-neutral-weak bg-gradient-to-br from-card to-fill-neutral-weaker/30 ring-stroke-neutral-weak/80",
        className,
      )}
    >
      <CardHeader className="gap-1 pb-2">
        <CardTitle className="font-garamond text-lg text-text-neutral-strong">
          Storage
        </CardTitle>
        <CardDescription className="font-inter text-text-neutral-weak">
          {isProOrAbove
            ? "Your plan includes 10 GB for memories and media."
            : "Free includes 200 MB. Upgrade for 10 GB."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2 font-inter text-sm">
          <span
            className={cn(
              "tabular-nums text-text-neutral-strong",
              nearFull && "font-semibold text-text-warning-strong",
            )}
          >
            {formatBytes(used)} used
          </span>
          <span className="text-muted-foreground tabular-nums">
            of {formatBytes(limit)}
          </span>
        </div>
        <Progress
          value={pct}
          className={cn(
            "h-2",
            nearFull &&
              "[&_[data-slot=progress-indicator]]:bg-fill-warning-strong",
          )}
        />
        <div className="flex flex-wrap justify-between gap-2 font-inter text-xs text-text-neutral-weak">
          {reserved > 0 ? (
            <span>{formatBytes(reserved)} currently uploading</span>
          ) : (
            <span />
          )}
          <span>{formatBytes(remaining)} available</span>
        </div>
        {warning ? (
          <p
            role="alert"
            className="rounded-xl border border-stroke-warning-strong/20 bg-fill-warning-weak px-3 py-2 font-inter text-xs text-text-warning-strong"
          >
            {warning}
          </p>
        ) : null}
      </CardContent>
      {!isProOrAbove ? (
        <CardFooter className="pt-0">
          <>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="rounded-full font-inter"
              onClick={() => setUpgradeOpen(true)}
            >
              Get more storage
            </Button>
            <UpgradePrompt
              feature="storage"
              variant="modal"
              open={upgradeOpen}
              onOpenChange={setUpgradeOpen}
            />
          </>
        </CardFooter>
      ) : null}
    </Card>
  );
}

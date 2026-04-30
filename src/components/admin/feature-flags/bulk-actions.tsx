import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BulkActionsProps {
  onRun: (prefix: string, value: boolean, reason?: string) => Promise<void>;
}

export function BulkActions({ onRun }: BulkActionsProps) {
  const [prefix, setPrefix] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const run = async (value: boolean) => {
    if (!prefix.trim()) return;
    setIsLoading(true);
    try {
      await onRun(prefix.trim(), value, reason.trim() || undefined);
      setReason("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-stroke-neutral-weak p-3">
      <p className="text-sm font-semibold text-text-neutral-strong">Bulk by key prefix</p>
      <Input
        value={prefix}
        onChange={(e) => setPrefix(e.target.value)}
        placeholder="e.g. chat. or memory."
      />
      <Input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (optional)"
      />
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={isLoading} onClick={() => run(true)}>
          Enable
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={isLoading} onClick={() => run(false)}>
          Disable
        </Button>
      </div>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export interface FlagRow {
  key: string;
  domain: string;
  description?: string;
  defaultValue: boolean;
  effectiveValue: boolean;
  hasOverrides: boolean;
  updatedAt?: string;
}

interface FlagsTableProps {
  rows: FlagRow[];
  loading?: boolean;
  selectedKey?: string;
  onSelect: (key: string) => void;
  onToggle: (row: FlagRow, value: boolean) => void;
}

export function FlagsTable({
  rows,
  loading = false,
  selectedKey,
  onSelect,
  onToggle,
}: FlagsTableProps) {
  if (loading) {
    return <div className="rounded-xl border border-stroke-neutral-weak p-4 text-sm text-text-neutral-weak">Loading flags...</div>;
  }
  if (rows.length === 0) {
    return <div className="rounded-xl border border-stroke-neutral-weak p-4 text-sm text-text-neutral-weak">No flags found.</div>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-stroke-neutral-weak">
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 border-b border-stroke-neutral-weak bg-fill-neutral-weaker px-4 py-2 text-xs font-semibold uppercase tracking-wide text-text-neutral-weak">
        <div>Flag</div>
        <div>Domain</div>
        <div>Status</div>
        <div>Overrides</div>
        <div className="text-right">Toggle</div>
      </div>
      <div className="max-h-[520px] overflow-y-auto">
        {rows.map((row) => (
          <button
            key={row.key}
            type="button"
            onClick={() => onSelect(row.key)}
            className={`grid w-full grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-3 border-b border-stroke-neutral-weaker px-4 py-3 text-left transition-colors hover:bg-fill-neutral-weaker ${selectedKey === row.key ? "bg-fill-brand-weak" : ""}`}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-neutral-strong">{row.key}</p>
              <p className="truncate text-xs text-text-neutral-weak">{row.description || "No description"}</p>
            </div>
            <div className="text-sm text-text-neutral-weak">{row.domain}</div>
            <div>
              <Badge variant={row.effectiveValue ? "default" : "outline"}>
                {row.effectiveValue ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="text-sm text-text-neutral-weak">{row.hasOverrides ? "Yes" : "No"}</div>
            <div className="flex justify-end gap-2">
              <Switch
                checked={row.effectiveValue}
                onCheckedChange={(next) => onToggle(row, next)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Toggle ${row.key}`}
              />
              <Button variant="ghost" size="sm" type="button">
                Open
              </Button>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

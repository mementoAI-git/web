import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FlagAuditTimeline } from "./flag-audit-timeline";

interface FlagDetailPanelProps {
  selectedKey?: string;
  getDetail: (key: string) => Promise<{
    definition?: { description?: string };
  } | null>;
  getAudit: (key: string) => Promise<Array<Record<string, unknown>>>;
  onUpsertOverride: (
    key: string,
    scopeType: "global" | "environment" | "user",
    scopeId: string,
    value: boolean,
    reason?: string,
    rolloutPercentage?: number | null,
  ) => Promise<void>;
  onDeleteOverride: (
    key: string,
    scopeType: "global" | "environment" | "user",
    scopeId: string,
    reason?: string,
  ) => Promise<void>;
}

export function FlagDetailPanel({
  selectedKey,
  getDetail,
  getAudit,
  onUpsertOverride,
  onDeleteOverride,
}: FlagDetailPanelProps) {
  const [detail, setDetail] = useState<{
    definition?: { description?: string };
  } | null>(null);
  const [audit, setAudit] = useState<Array<Record<string, unknown>>>([]);
  const [reason, setReason] = useState("");
  const [scopeType, setScopeType] = useState<"global" | "environment" | "user">("global");
  const [scopeId, setScopeId] = useState("global");
  const [value, setValue] = useState(true);
  const [rollout, setRollout] = useState<string>("");

  useEffect(() => {
    if (!selectedKey) return;
    void getDetail(selectedKey).then((v) => setDetail(v));
    void getAudit(selectedKey).then((v) => setAudit(Array.isArray(v) ? v : []));
  }, [selectedKey, getDetail, getAudit]);

  if (!selectedKey) {
    return <div className="rounded-xl border border-stroke-neutral-weak p-4 text-sm text-text-neutral-weak">Select a feature flag to view details.</div>;
  }

  return (
    <div className="space-y-4 rounded-xl border border-stroke-neutral-weak p-4">
      <div>
        <h3 className="text-base font-semibold text-text-neutral-strong">{selectedKey}</h3>
        <p className="text-xs text-text-neutral-weak">{detail?.definition?.description || "No description"}</p>
      </div>

      <div className="space-y-2 rounded-lg border border-stroke-neutral-weaker p-3">
        <p className="text-sm font-semibold text-text-neutral-strong">Override</p>
        <div className="grid grid-cols-2 gap-2">
          <Input value={scopeType} onChange={(e) => setScopeType(e.target.value as "global" | "environment" | "user")} />
          <Input value={scopeId} onChange={(e) => setScopeId(e.target.value)} />
          <Input value={rollout} onChange={(e) => setRollout(e.target.value)} placeholder="rollout % (optional)" />
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="reason (optional)" />
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={value} onCheckedChange={setValue} />
          <span className="text-sm text-text-neutral-weak">{value ? "Enabled" : "Disabled"}</span>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            onClick={async () => {
              await onUpsertOverride(
                selectedKey,
                scopeType,
                scopeId,
                value,
                reason || undefined,
                rollout === "" ? undefined : Number(rollout),
              );
              const nextDetail = await getDetail(selectedKey);
              setDetail(nextDetail);
              setAudit(await getAudit(selectedKey));
            }}
          >
            Save override
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={async () => {
              await onDeleteOverride(selectedKey, scopeType, scopeId, reason || undefined);
              const nextDetail = await getDetail(selectedKey);
              setDetail(nextDetail);
              setAudit(await getAudit(selectedKey));
            }}
          >
            Delete override
          </Button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-text-neutral-strong">Audit</p>
        <FlagAuditTimeline events={audit} />
      </div>
    </div>
  );
}

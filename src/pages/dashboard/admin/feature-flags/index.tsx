import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFeatureFlagsAdmin } from "@/contexts/feature-flags-admin";
import { useStore } from "@/hooks/use-store";
import { isFeatureFlagAdminUser } from "@/contexts/feature-flags";
import { FlagsTable } from "@/components/admin/feature-flags/flags-table";
import { FlagDetailPanel } from "@/components/admin/feature-flags/flag-detail-panel";
import { BulkActions } from "@/components/admin/feature-flags/bulk-actions";

type FlagRow = {
  key: string;
  domain?: string;
  description?: string;
  defaultValue?: boolean;
  effectiveValue?: boolean;
  hasOverrides?: boolean;
  updatedAt?: string;
};

export default function AdminFeatureFlagsPage() {
  const { user } = useStore();
  const isAdmin = isFeatureFlagAdminUser(user?.email);
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | undefined>(undefined);
  const admin = useFeatureFlagsAdmin();
  const { data, isLoading } = admin.useFlagsList({ page: 1, limit: 200, search });

  const rows = useMemo(() => {
    const docs = Array.isArray(data?.data?.docs)
      ? (data.data.docs as FlagRow[])
      : [];
    return docs.map((item) => ({
      key: item.key,
      domain: item.domain,
      description: item.description,
      defaultValue: Boolean(item.defaultValue),
      effectiveValue: Boolean(item.effectiveValue),
      hasOverrides: Boolean(item.hasOverrides),
      updatedAt: item.updatedAt,
    }));
  }, [data]);

  if (!isAdmin) {
    return (
      <div className="page-viewport w-full px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-xl border border-stroke-neutral-weak p-6">
          <h1 className="font-garamond text-2xl text-text-neutral-strong">Feature Flags</h1>
          <p className="mt-2 text-sm text-text-neutral-weak">
            You do not have permission to access this dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-viewport w-full px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-garamond text-3xl text-text-neutral-strong">Feature Flags</h1>
            <p className="text-sm text-text-neutral-weak">Runtime controls for platform features.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
          <div className="space-y-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by key or description..."
              className="max-w-md"
            />
            <FlagsTable
              rows={rows}
              loading={isLoading}
              selectedKey={selectedKey}
              onSelect={setSelectedKey}
              onToggle={async (row, next) => {
                try {
                  await admin.upsertOverride(row.key, "global", "global", next, "Quick toggle");
                  toast.success(`${row.key} ${next ? "enabled" : "disabled"}`);
                } catch {
                  toast.error("Could not update feature flag");
                }
              }}
            />
          </div>

          <div className="space-y-4">
            <BulkActions
              onRun={async (prefix, value, reason) => {
                await admin.bulkByPrefix(prefix, value, reason);
                toast.success(`Bulk update complete (${prefix})`);
              }}
            />
            <FlagDetailPanel
              selectedKey={selectedKey}
              getDetail={admin.getFlagDetail}
              getAudit={admin.getFlagAudit}
              onUpsertOverride={admin.upsertOverride}
              onDeleteOverride={admin.deleteOverride}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

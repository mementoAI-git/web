import useSWR from "swr";
import endpoint from "@/api/endpoint";

type OverviewResponse = {
  totals?: {
    events?: number;
    error_events?: number;
    fallback_events?: number;
    error_rate?: number;
    fallback_rate?: number;
  };
  provider_breakdown?: Array<{
    provider: string;
    requests: number;
    avg_duration_ms: number | null;
    avg_stream_connect_ms: number | null;
    fallback_count: number;
    token_usage_total: number;
  }>;
  task_breakdown?: Array<{
    task: string;
    requests: number;
    avg_duration_ms: number | null;
    fallback_count: number;
  }>;
  slo?: {
    error_rate_max: number;
    fallback_rate_max: number;
    p95_latency_ms_max: number;
  };
  alerts?: Array<{
    severity: "info" | "warning" | "critical";
    key: string;
    message: string;
  }>;
};

type TimeseriesResponse = {
  points?: Array<{
    bucket_start: string;
    requests: number;
    errors: number;
    fallbacks: number;
    fallback_rate: number;
    error_rate: number;
    avg_duration_ms: number | null;
    provider_mix: Array<{ provider: string; requests: number }>;
  }>;
};

type PromptGovernanceResponse = {
  registry?: {
    all_valid?: boolean;
    tasks?: Array<{
      task: string;
      effective_version: string;
      valid_version_format: boolean;
    }>;
  };
};

function formatPct(value?: number) {
  return `${((value || 0) * 100).toFixed(1)}%`;
}

function formatMs(value?: number | null) {
  if (value == null) return "--";
  return `${Math.round(value)} ms`;
}

function TinyBar({ value, max, color }: { value: number; max: number; color: string }) {
  const width = max > 0 ? Math.max(3, (value / max) * 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-v3-fill-weak">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
    </div>
  );
}

export default function AiHealthPage() {
  const {
    data: overviewData,
    isLoading: loadingOverview,
    error: overviewError,
  } = useSWR<{ data?: OverviewResponse }>(`${endpoint.aiMetricsOverview}?hours=24`);

  const {
    data: timeseriesData,
    isLoading: loadingTimeseries,
    error: timeseriesError,
  } = useSWR<{ data?: TimeseriesResponse }>(
    `${endpoint.aiMetricsTimeseries}?hours=24&interval_minutes=60`,
  );
  const { data: governanceData } = useSWR<{ data?: PromptGovernanceResponse }>(
    endpoint.aiPromptGovernanceStatus,
  );

  const totals = overviewData?.data?.totals;
  const providers = overviewData?.data?.provider_breakdown || [];
  const tasks = overviewData?.data?.task_breakdown || [];
  const slo = overviewData?.data?.slo;
  const alerts = overviewData?.data?.alerts || [];
  const points = timeseriesData?.data?.points || [];
  const governance = governanceData?.data?.registry;
  const maxRequests = Math.max(1, ...points.map((p) => p.requests || 0));
  const maxErrors = Math.max(1, ...points.map((p) => p.errors || 0));

  return (
    <div className="page-viewport hide-scrollbar">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-5 px-4 pb-10 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-v3-stroke-weak bg-[#0f131a] p-5 text-[#e8edf5]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-garamond text-3xl font-medium leading-tight text-white">
                AI Health
              </h1>
              <p className="mt-1 text-sm text-[#a8b3c7]">
                Last 24 hours - provider reliability, fallbacks, and latency
              </p>
            </div>
            <div className="rounded-lg border border-[#2a3342] bg-[#151c27] px-3 py-1.5 text-xs text-[#b8c2d5]">
              Live from /ai/metrics/*
            </div>
          </div>
        </section>

        {(overviewError || timeseriesError) && (
          <div className="rounded-xl border border-stroke-error-strong/20 bg-fill-error-weak p-3 text-sm text-text-error-strong">
            Could not load AI metrics. Please try again.
          </div>
        )}

        {alerts.length > 0 && (
          <section className="rounded-xl border border-stroke-warning-strong/20 bg-fill-warning-weak p-4">
            <h2 className="text-sm font-semibold text-text-warning-strong">Active Alerts</h2>
            <div className="mt-2 space-y-1.5">
              {alerts.map((alert) => (
                <p key={alert.key} className="text-sm text-text-warning-weak">
                  [{alert.severity.toUpperCase()}] {alert.message}
                </p>
              ))}
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-v3-stroke-weak bg-white p-4">
            <p className="text-xs text-v3-text-weak">Requests</p>
            <p className="mt-1 text-2xl font-semibold text-v3-text-strong">
              {loadingOverview ? "--" : totals?.events ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-v3-stroke-weak bg-white p-4">
            <p className="text-xs text-v3-text-weak">Error rate</p>
            <p className="mt-1 text-2xl font-semibold text-v3-text-strong">
              {loadingOverview ? "--" : formatPct(totals?.error_rate)}
            </p>
          </div>
          <div className="rounded-xl border border-v3-stroke-weak bg-white p-4">
            <p className="text-xs text-v3-text-weak">Fallback rate</p>
            <p className="mt-1 text-2xl font-semibold text-v3-text-strong">
              {loadingOverview ? "--" : formatPct(totals?.fallback_rate)}
            </p>
          </div>
          <div className="rounded-xl border border-v3-stroke-weak bg-white p-4">
            <p className="text-xs text-v3-text-weak">P95 latency</p>
            <p className="mt-1 text-2xl font-semibold text-v3-text-strong">
              {loadingOverview ? "--" : formatMs(totals?.p95_duration_ms)}
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-v3-stroke-weak bg-white p-4">
          <h2 className="text-sm font-semibold text-v3-text-strong">SLO Targets</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <p className="text-xs text-v3-text-weak">
              Error rate max: <span className="font-semibold text-v3-text-strong">{formatPct(slo?.error_rate_max)}</span>
            </p>
            <p className="text-xs text-v3-text-weak">
              Fallback rate max: <span className="font-semibold text-v3-text-strong">{formatPct(slo?.fallback_rate_max)}</span>
            </p>
            <p className="text-xs text-v3-text-weak">
              P95 latency max: <span className="font-semibold text-v3-text-strong">{formatMs(slo?.p95_latency_ms_max)}</span>
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-v3-stroke-weak bg-white p-4">
            <h2 className="text-sm font-semibold text-v3-text-strong">Provider Breakdown</h2>
            <div className="mt-3 space-y-3">
              {providers.length === 0 && !loadingOverview ? (
                <p className="text-sm text-v3-text-weak">No provider data yet.</p>
              ) : (
                providers.map((row) => (
                  <div key={row.provider} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-v3-text-strong capitalize">
                        {row.provider}
                      </span>
                      <span className="text-v3-text-weak">{row.requests} req</span>
                    </div>
                    <TinyBar
                      value={row.requests}
                      max={Math.max(1, ...providers.map((p) => p.requests))}
                      color="bg-[#1ED348]"
                    />
                    <div className="grid grid-cols-3 gap-2 text-xs text-v3-text-weak">
                      <span>Avg: {formatMs(row.avg_duration_ms)}</span>
                      <span>Connect: {formatMs(row.avg_stream_connect_ms)}</span>
                      <span>Fallbacks: {row.fallback_count}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-v3-stroke-weak bg-white p-4">
            <h2 className="text-sm font-semibold text-v3-text-strong">Task Breakdown</h2>
            <div className="mt-3 space-y-3">
              {tasks.length === 0 && !loadingOverview ? (
                <p className="text-sm text-v3-text-weak">No task data yet.</p>
              ) : (
                tasks.map((row) => (
                  <div key={row.task} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-v3-text-strong">{row.task}</span>
                      <span className="text-v3-text-weak">{row.requests} req</span>
                    </div>
                    <TinyBar
                      value={row.requests}
                      max={Math.max(1, ...tasks.map((t) => t.requests))}
                      color="bg-[#2f7ef7]"
                    />
                    <div className="grid grid-cols-2 gap-2 text-xs text-v3-text-weak">
                      <span>Avg: {formatMs(row.avg_duration_ms)}</span>
                      <span>Fallbacks: {row.fallback_count}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-v3-stroke-weak bg-white p-4">
          <h2 className="text-sm font-semibold text-v3-text-strong">24h Trends (hourly)</h2>
          <div className="mt-4 grid grid-cols-1 gap-3">
            {loadingTimeseries ? (
              <p className="text-sm text-v3-text-weak">Loading trend data...</p>
            ) : points.length === 0 ? (
              <p className="text-sm text-v3-text-weak">No trend data yet.</p>
            ) : (
              points.map((point) => (
                <div key={point.bucket_start} className="rounded-lg border border-v3-stroke-weak p-3">
                  <div className="mb-2 flex items-center justify-between text-xs text-v3-text-weak">
                    <span>{new Date(point.bucket_start).toLocaleString()}</span>
                    <span>
                      {point.requests} req - {point.errors} err - {point.fallbacks} fb
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <TinyBar value={point.requests} max={maxRequests} color="bg-[#2f7ef7]" />
                    <TinyBar value={point.errors} max={maxErrors} color="bg-[#ef4444]" />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-v3-stroke-weak bg-white p-4">
          <h2 className="text-sm font-semibold text-v3-text-strong">Prompt Governance</h2>
          <p className="mt-1 text-xs text-v3-text-weak">
            Registry health for runtime prompt versions and rollback readiness.
          </p>
          <div className="mt-3">
            <p className="text-sm">
              Status:{" "}
              <span className={governance?.all_valid ? "text-green-600" : "text-red-600"}>
                {governance?.all_valid ? "Healthy" : "Needs attention"}
              </span>
            </p>
            <div className="mt-2 grid grid-cols-1 gap-1.5">
              {(governance?.tasks || []).map((item) => (
                <p key={item.task} className="text-xs text-v3-text-weak">
                  {item.task}: <span className="text-v3-text-strong">{item.effective_version}</span>
                </p>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

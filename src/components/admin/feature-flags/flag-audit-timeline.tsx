interface FlagAuditTimelineProps {
  events: Array<{
    _id?: string;
    action?: string;
    actor?: string;
    scope_type?: string;
    scope_id?: string;
    old_value?: boolean | null;
    new_value?: boolean | null;
    reason?: string;
    created_at?: string;
  }>;
}

export function FlagAuditTimeline({ events }: FlagAuditTimelineProps) {
  if (!events.length) {
    return <p className="text-sm text-text-neutral-weak">No audit events yet.</p>;
  }

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div
          key={event._id || `${event.action}-${event.created_at}`}
          className="rounded-lg border border-stroke-neutral-weaker bg-fill-neutral-weaker p-3"
        >
          <p className="text-sm font-medium text-text-neutral-strong">
            {event.action} on {event.scope_type}:{event.scope_id}
          </p>
          <p className="text-xs text-text-neutral-weak">
            {String(event.old_value)} {"->"} {String(event.new_value)} by {event.actor || "unknown"}
          </p>
          {event.reason ? (
            <p className="mt-1 text-xs text-text-neutral-weak">{event.reason}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

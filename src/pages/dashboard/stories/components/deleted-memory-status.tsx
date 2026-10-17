import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { recoveryLabel, type RecoveryDates } from "./memory-recovery";

export function DeletedMemoryStatus({ memory, showDeletedAt = false }: { memory: RecoveryDates; showDeletedAt?: boolean }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const deletedAt = memory.deleted_at && dayjs(memory.deleted_at).isValid() ? memory.deleted_at : undefined;
  const deadline = memory.delete_after && dayjs(memory.delete_after).isValid() ? memory.delete_after : undefined;
  return (
    <div className="space-y-1 font-inter text-xs leading-relaxed text-text-neutral-weak">
      {showDeletedAt && deletedAt && <time className="block" dateTime={deletedAt} title={dayjs(deletedAt).format("MMM D, YYYY [at] h:mm A")}>{dayjs(deletedAt).format("MMM DD, YYYY")}</time>}
      {deadline ? <time className="block" dateTime={deadline} title={`Permanent deletion: ${dayjs(deadline).format("MMM D, YYYY [at] h:mm A")}`}>{recoveryLabel(deadline, now)}</time> : <span>Recovery window unavailable</span>}
    </div>
  );
}

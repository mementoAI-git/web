import { createPortal } from "react-dom";
import dayjs from "dayjs";
import { ClockCheck } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "motion/react";
import useSWR from "swr";
import { Spinner } from "@/components/ui/spinner";
import { getQuestionIdenticonUrl } from "@/features/explore/question-identicon";
import type { ObservationItem } from "./observation-list";
import type { useSourcesPreview } from "./use-sources-preview";
import {
  NO_OBSERVATION_SOURCES,
  observationSourcesUrl,
} from "./observation-sources";
import type { PersonaObservationSourcesResponse } from "./observations-api.types";

/** It can't be scrolled, since it follows the cursor. */
const MAX_ROWS = 4;
const TRAIL = { stiffness: 220, damping: 24, mass: 0.6 };
const TILT = { stiffness: 300, damping: 30 };
const MAX_TILT_DEGREES = 7;
const TILT_AT_SPEED = 1400;

function PreviewRows({ id }: { id: string }) {
  const { data, error, isLoading } = useSWR<{
    data: PersonaObservationSourcesResponse;
  }>(observationSourcesUrl(id));
  if (error && !data)
    return (
      <p className="insights-sources-message">Couldn’t load the sources.</p>
    );
  if (isLoading && !data)
    return (
      <p className="insights-sources-message">
        <Spinner />
        Loading sources…
      </p>
    );
  const sources = data?.data?.sources ?? [];
  if (!sources.length)
    return <p className="insights-sources-message">{NO_OBSERVATION_SOURCES}</p>;
  const hidden = sources.length - MAX_ROWS;
  return (
    <>
      <ul className="insights-sources-list">
        {sources.slice(0, MAX_ROWS).map((source) => (
          <li key={source.id} className="insights-source">
            <img
              src={source.thumbnail || getQuestionIdenticonUrl(source.id)}
              alt=""
              decoding="async"
              referrerPolicy="no-referrer"
              className="insights-source-thumbnail object-cover"
            />
            <span className="min-w-0 flex-1 truncate font-medium text-text-neutral-strong">
              {source.title}
            </span>
            {source.created_at && (
              <span className="flex shrink-0 items-center gap-1.5 text-xs text-text-neutral-weak">
                <ClockCheck className="size-4" aria-hidden />
                {dayjs(source.created_at).format("MMM D, YYYY")}
              </span>
            )}
          </li>
        ))}
      </ul>
      {hidden > 0 && <p className="insights-sources-more">+{hidden} more</p>}
    </>
  );
}

function TrailingPopup({
  item,
  x,
  y,
  popup,
}: {
  item: ObservationItem;
  x: MotionValue<number>;
  y: MotionValue<number>;
  popup: React.RefObject<HTMLDivElement | null>;
}) {
  const reduceMotion = Boolean(useReducedMotion());
  const trailX = useSpring(x, TRAIL);
  const trailY = useSpring(y, TRAIL);
  const speed = useVelocity(trailX);
  const tilt = useSpring(
    useTransform(
      speed,
      [-TILT_AT_SPEED, TILT_AT_SPEED],
      [-MAX_TILT_DEGREES, MAX_TILT_DEGREES],
      { clamp: true },
    ),
    TILT,
  );
  return (
    <motion.div
      ref={popup}
      // The sources page is the way to reach these with a keyboard or screen reader.
      aria-hidden
      data-testid="observation-sources-preview"
      className="insights-sources-popup"
      style={reduceMotion ? { x, y } : { x: trailX, y: trailY, rotate: tilt }}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      <p className="insights-sources-label">Sources</p>
      <PreviewRows id={item.id} />
    </motion.div>
  );
}

/** A view-only popup that trails the cursor and tilts with its speed. */
export function ObservationSourcesPreview({
  preview,
}: {
  preview: ReturnType<typeof useSourcesPreview>;
}) {
  return createPortal(
    <AnimatePresence>
      {preview.item && (
        <TrailingPopup
          key="sources-preview"
          item={preview.item}
          x={preview.x}
          y={preview.y}
          popup={preview.popup}
        />
      )}
    </AnimatePresence>,
    document.body,
  );
}

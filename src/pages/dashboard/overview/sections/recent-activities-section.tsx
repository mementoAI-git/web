import { Link } from "react-router-dom";
import { Fragment, useMemo } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import calendar from "dayjs/plugin/calendar";
import endpoint from "@/api/endpoint";
import { isEmpty } from "@/utility";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { TypographyH2, TypographyMuted } from "@/components/ui/typography";

dayjs.extend(calendar);

// ── Deterministic color seeding ──────────────────────────────────────────────
// Stable accent color from activity._id → visual variety even when all items
// share the same type.
const ACCENT_COLORS = [
  "#3B82F6", // blue
  "#F59E0B", // amber
  "#10B981", // emerald
  "#EC4899", // pink
  "#8B5CF6", // violet
];

function stableHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getAccentColor(id: string): string {
  return ACCENT_COLORS[stableHash(id) % ACCENT_COLORS.length];
}

// ── Icon components (plain SVG — matches mobile FolderIcon / ChatBubbleIcon shapes) ──

function FolderIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M26.426 8a2.667 2.667 0 0 1 2.63 3.105L26.834 24.44a2.667 2.667 0 0 1-2.63 2.228H7.796a2.667 2.667 0 0 1-2.631-2.228L2.944 11.105A2.667 2.667 0 0 1 5.573 8h20.853Z"
        fill={color}
        fillOpacity={0.3}
      />
      <path
        d="M24 4a1.333 1.333 0 1 1 0 2.667H8A1.333 1.333 0 0 1 8 4h16Z"
        fill={color}
      />
    </svg>
  );
}

function ChatBubbleIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.667 8a4 4 0 0 1 4-4h18.667a4 4 0 0 1 4 4v13.333a4 4 0 0 1-4 4H9.778l-4.444 3.334c-1.099.824-2.667.04-2.667-1.334V8Z"
        fill={color}
        fillOpacity={0.3}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.666 16a1.333 1.333 0 0 0 0 2.667h4a1.333 1.333 0 1 0 0-2.667h-4Zm-1.333-4a1.333 1.333 0 0 1 1.333-1.333h10.667a1.333 1.333 0 1 1 0 2.666H10.666A1.333 1.333 0 0 1 9.333 12Z"
        fill={color}
      />
    </svg>
  );
}

function ZapIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16.497 56.218C16.244 56.203 15.998 56.124 15.785 55.987C15.571 55.851 15.396 55.661 15.276 55.437C15.156 55.214 15.096 54.963 15.101 54.709C15.106 54.456 15.177 54.207 15.305 53.989L26.744 34.551L8.889 33.534C8.587 33.517 8.298 33.408 8.06 33.221C7.822 33.035 7.646 32.781 7.557 32.492C7.468 32.203 7.469 31.894 7.561 31.606C7.653 31.318 7.83 31.065 8.07 30.881L42.201 4.641C42.474 4.431 42.811 4.322 43.155 4.334C43.499 4.345 43.828 4.476 44.086 4.704C44.344 4.932 44.514 5.243 44.568 5.583C44.622 5.923 44.555 6.271 44.38 6.567L32.941 26.004L50.795 27.021C51.097 27.038 51.386 27.147 51.624 27.333C51.861 27.52 52.036 27.774 52.125 28.063C52.214 28.352 52.213 28.661 52.121 28.949C52.029 29.237 51.852 29.49 51.612 29.674L17.484 55.914C17.202 56.13 16.852 56.238 16.497 56.218Z"
        fill={color}
        fillOpacity={0.3}
      />
      <path
        d="M16.745 56.315C16.484 56.315 16.228 56.248 16 56.12C15.773 55.992 15.582 55.808 15.446 55.586C15.31 55.363 15.234 55.109 15.225 54.849C15.215 54.588 15.272 54.33 15.392 54.097L25.992 33.485H7.613C7.302 33.485 6.999 33.39 6.744 33.213C6.489 33.036 6.294 32.785 6.186 32.494C6.077 32.203 6.06 31.886 6.138 31.585C6.215 31.284 6.382 31.014 6.617 30.811L40.103 1.893C40.37 1.662 40.71 1.531 41.063 1.522C41.417 1.514 41.762 1.629 42.04 1.848C42.318 2.067 42.511 2.377 42.586 2.722C42.661 3.067 42.614 3.428 42.451 3.743L31.85 24.353H50.228C50.539 24.353 50.842 24.448 51.097 24.626C51.352 24.803 51.546 25.054 51.654 25.345C51.763 25.636 51.779 25.953 51.702 26.254C51.625 26.555 51.457 26.825 51.222 27.028L17.74 55.945C17.463 56.184 17.11 56.315 16.745 56.315Z"
        fill={color}
      />
    </svg>
  );
}

function HourglassIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 4H24M8 28H24M10 4V10L16 16L10 22V28M22 4V10L16 16L22 22V28"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.85}
      />
      <path d="M10 4H22V10L16 16L10 10V4Z" fill={color} fillOpacity={0.2} />
    </svg>
  );
}

// ── Type + title → icon ───────────────────────────────────────────────────────
type IconShape = "folder" | "chat" | "zap" | "hourglass";

function getIconShape(type?: string, title?: string): IconShape {
  const t = title?.toLowerCase() ?? "";
  const ty = type?.toLowerCase() ?? "";

  if (t.includes("quick capture") || t.includes("quick_capture")) return "zap";
  if (t.includes("capsule")) return "hourglass";
  if (t.includes("chat") || t.includes("conversation") || t.includes("message")) return "chat";

  switch (ty) {
    case "memory":
    case "story":
      return "folder";
    case "chat":
    case "conversation":
    case "message":
      return "chat";
    case "quick_capture":
    case "quickcapture":
      return "zap";
    case "capsule":
      return "hourglass";
    default:
      return "folder";
  }
}

function ActivityIcon({ type, title, id, size = 28 }: { type?: string; title?: string; id: string; size?: number }) {
  const color = getAccentColor(id);
  const shape = getIconShape(type, title);
  switch (shape) {
    case "folder": return <FolderIcon color={color} size={size} />;
    case "zap": return <ZapIcon color={color} size={size} />;
    case "hourglass": return <HourglassIcon color={color} size={size} />;
    default: return <ChatBubbleIcon color={color} size={size} />;
  }
}

// ── Description sanitisation ─────────────────────────────────────────────────
const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

function sanitiseDescription(description: string, title?: string): string {
  const match = description.match(/^(.+?):\s*"([^"]+)"$/);
  if (match && OBJECT_ID_RE.test(match[2])) {
    return title || match[1].trim();
  }
  return description;
}

// ── Date formatting ───────────────────────────────────────────────────────────
const formatActivityDate = (date: string) => {
  const d = dayjs(date);
  const now = dayjs();
  const time = d.format("h:mm A");
  if (d.isSame(now, "day")) return `Today · ${time}`;
  if (d.isSame(now.subtract(1, "day"), "day")) return `Yesterday · ${time}`;
  if (d.isAfter(now.subtract(7, "day"))) return `${now.diff(d, "day")} days ago · ${time}`;
  return `${d.format("MMM D")} · ${time}`;
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface Activity {
  _id: string;
  title?: string;
  description: string;
  created_at: string;
  type?: string;
  action?: string;
}

interface ActivitiesResponse {
  data?: {
    docs?: Activity[];
  };
}

// ── Item component ────────────────────────────────────────────────────────────
function RecentActivityItem({ activity }: { activity: Activity }) {
  const formattedDate = useMemo(
    () => formatActivityDate(activity.created_at),
    [activity.created_at],
  );
  const accentColor = getAccentColor(activity._id);

  return (
    <div className="flex w-full items-center gap-3 py-3">
      {/* Icon container — tinted bg matching the accent color */}
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: accentColor + "18" }}
      >
        <ActivityIcon type={activity.type} title={activity.title} id={activity._id} size={26} />
      </div>
      <div className="min-w-0 flex-1">
        <TypographyH2 className="line-clamp-2 font-inter text-base font-normal text-text-neutral-strong sm:text-base md:text-base lg:text-base sm:line-clamp-none sm:truncate">
          {sanitiseDescription(activity.description, activity.title)}
        </TypographyH2>
        <TypographyMuted className="font-inter text-xs text-text-neutral-weak">
          {formattedDate}
        </TypographyMuted>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function RecentActivitySkeleton({ isFirst }: { isFirst?: boolean }) {
  return (
    <Fragment>
      {!isFirst ? <Separator className="bg-stroke-neutral-weaker" /> : null}
      <div className="flex w-full items-start gap-3 py-3">
        <Skeleton className="size-10 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </Fragment>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
export default function RecentActivitiesSection({ onNavigate }: { onNavigate?: () => void } = {}) {
  const { data, isLoading } = useSWR<ActivitiesResponse>(
    `${endpoint.activities}?page=1&limit=4`,
  );
  const activities = data?.data?.docs ?? [];

  return (
    <div className="flex flex-1 flex-col gap-3 sm:gap-4">
      <header className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <TypographyH2 className="font-garamond font-normal text-xl leading-tight text-text-neutral-strong sm:text-2xl sm:leading-[38px] lg:text-[32px]">
          Recent{" "}
          <i className="text-text-neutral-weaker">Activities</i>
        </TypographyH2>
        <Button
          variant="link"
          asChild
          className="inline-flex min-h-[44px] shrink-0 items-center px-0 font-inter text-sm font-medium text-text-brand-strong underline hover:no-underline sm:min-h-0"
        >
          <Link to="/stories" onClick={onNavigate}>See all</Link>
        </Button>
      </header>
      <div className="flex flex-col">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <RecentActivitySkeleton key={`skeleton-${i}`} isFirst={i === 0} />
            ))
          : !isEmpty(activities)
            ? activities.map((activity, index) => (
                <Fragment key={activity._id ?? `activity-${index}`}>
                  {index > 0 ? (
                    <Separator className="bg-stroke-neutral-weaker" />
                  ) : null}
                  <RecentActivityItem activity={activity} />
                </Fragment>
              ))
            : (
              <div className="py-8 text-center">
                <TypographyMuted className="font-inter text-sm text-text-neutral-weak">
                  No recent activities
                </TypographyMuted>
              </div>
            )}
      </div>
    </div>
  );
}

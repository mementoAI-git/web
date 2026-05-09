import { Link, useNavigate } from "react-router-dom";
import useSWR from "swr";
import dayjs from "dayjs";
import calendar from "dayjs/plugin/calendar";
import endpoint from "@/api/endpoint";
import { fetcher } from "@/api/fetcher";
import {
  FolderIcon,
  ChevronRightIcon,
  CameraIcon,
  VideoIcon,
  FileIcon,
  VolumeIcon,
} from "@/components/icons";
import type { IMemory, IFile } from "@/utility/interface";
import { TypographyH2, TypographyMuted } from "@/components/ui/typography";

dayjs.extend(calendar);

type FileType = "photo" | "video" | "document" | "audio";

function getFileType(attachment?: IFile, memoryType?: string): FileType {
  const mime = attachment?.type?.toLowerCase() ?? "";
  if (mime.startsWith("image/")) return "photo";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (
    mime.includes("pdf") ||
    mime.includes("document") ||
    mime.includes("word") ||
    mime.includes("text")
  )
    return "document";
  // Fallback from memory type
  const type = memoryType?.toLowerCase() ?? "";
  if (["photo", "image"].includes(type)) return "photo";
  if (type === "video") return "video";
  if (type === "audio") return "audio";
  return "document";
}

function getFileTypeLabel(type: FileType): string {
  const labels: Record<FileType, string> = {
    photo: "Photo",
    video: "Video",
    document: "Document",
    audio: "Audio",
  };
  return labels[type];
}

function formatSubDescription(
  type: FileType,
  attachment?: IFile,
  createdAt?: string
): string {
  const parts: string[] = [getFileTypeLabel(type)];
  if (attachment?.duration) {
    const mins = Math.floor(attachment.duration / 60);
    const secs = Math.round(attachment.duration % 60);
    parts.push(`${mins}:${secs.toString().padStart(2, "0")}`);
  }
  if (createdAt) {
    const date = dayjs(createdAt);
    const now = dayjs();
    if (date.isSame(now, "day")) parts.push("Added today");
    else if (date.isSame(now.subtract(1, "day"), "day")) parts.push("Yesterday");
    else if (date.isAfter(now.subtract(7, "day")))
      parts.push(`${now.diff(date, "day")} days ago`);
    else parts.push(date.format("MMM D"));
  }
  return parts.join(" • ");
}

function getTagLabel(memory: IMemory): string {
  const hasPrivate =
    !memory.beneficiaries?.length && !memory.groups?.length;
  if (hasPrivate) return "Private";
  const count =
    (memory.beneficiaries?.length ?? 0) + (memory.groups?.length ?? 0);
  return count === 1 ? "1 person" : `${count} people`;
}

const FILE_TYPE_STYLES: Record<
  FileType,
  { bg: string; Icon: typeof CameraIcon }
> = {
  photo: {
    bg: "bg-fill-warning-weak",
    Icon: CameraIcon,
  },
  video: {
    bg: "bg-fill-success-weak",
    Icon: VideoIcon,
  },
  document: {
    bg: "bg-fill-neutral-weak",
    Icon: FileIcon,
  },
  audio: {
    bg: "bg-fill-warning-weaker",
    Icon: VolumeIcon,
  },
};

interface RecentFileItemProps {
  memory: IMemory;
}

function RecentFileItem({ memory }: RecentFileItemProps) {
  const navigate = useNavigate();
  const firstAttachment = memory.attachments?.[0];
  const fileType = getFileType(firstAttachment, memory.type);
  const { bg, Icon } = FILE_TYPE_STYLES[fileType];
  const tagLabel = getTagLabel(memory);

  const handleClick = () => {
    navigate(`/stories/${memory._id}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center gap-3 rounded-[12px] border border-stroke-neutral-weaker bg-fill-neutral-weaker p-3 text-left transition-colors hover:border-stroke-neutral-weak hover:bg-fill-neutral-weakest"
    >
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${bg}`}
      >
        <Icon className="size-5 text-icon-neutral" />
      </div>
      <div className="min-w-0 flex-1">
        <TypographyH2 className="truncate font-inter text-sm font-semibold text-text-neutral-strong">
          {memory.title || "Untitled"}
        </TypographyH2>
        <TypographyMuted className="font-inter text-xs text-text-neutral-weak">
          {formatSubDescription(fileType, firstAttachment, memory.created_at)}
        </TypographyMuted>
      </div>
      <span className="shrink-0 rounded-full bg-fill-success-weak px-2.5 py-1 font-inter text-xs font-medium text-text-success-strong">
        {tagLabel}
      </span>
    </button>
  );
}

function RecentFilesSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 rounded-2xl bg-fill-neutral-weaker p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="h-5 w-32 animate-pulse rounded bg-fill-neutral-weak" />
        <div className="h-4 w-16 animate-pulse rounded bg-fill-neutral-weak" />
      </div>
      <div className="border-t border-stroke-neutral-weaker" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-[12px] border border-stroke-neutral-weaker bg-fill-neutral-weak p-3"
          >
            <div className="size-10 shrink-0 animate-pulse rounded-lg bg-fill-neutral-weaker" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-3/4 animate-pulse rounded bg-fill-neutral-weaker" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-fill-neutral-weaker" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface MemoriesResponse {
  data?: {
    docs?: IMemory[];
    totalDocs?: number;
  };
}

export default function RecentFilesSection() {
  const { data, isLoading } = useSWR<MemoriesResponse>(
    `${endpoint.memories}?page=1&limit=4&sort=-created_at`,
    fetcher
  );

  const memories = data?.data?.docs ?? [];

  if (isLoading) {
    return <RecentFilesSkeleton />;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 rounded-2xl bg-fill-neutral-weaker p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderIcon className="size-5 text-icon-neutral" />
          <TypographyH2 className="font-inter text-base font-semibold text-text-neutral-strong">
            Recent Files
          </TypographyH2>
        </div>
        <Link
          to="/stories"
          className="flex items-center gap-1 font-inter text-sm font-medium text-text-brand-strong hover:underline"
        >
          View all
          <ChevronRightIcon width={14} height={14} />
        </Link>
      </div>
      <div className="border-t border-stroke-neutral-weaker" />
      <div className="space-y-2">
        {memories.length === 0 ? (
          <TypographyMuted className="py-8 text-center font-inter text-sm text-text-neutral-weak">
            No recent files yet
          </TypographyMuted>
        ) : (
          memories.map((memory) => (
            <RecentFileItem key={memory._id} memory={memory} />
          ))
        )}
      </div>
    </div>
  );
}

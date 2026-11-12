import type { ReactNode } from "react";
import dayjs from "dayjs";
import { CalendarDays } from "lucide-react";
import calendarIcon from "@/assets/icon/uim_calendar.svg";
import FileGallery from "@/components/file-gallery";
import albumArtwork from "@/assets/image/HD Album story bg memento.webp";
import darkAlbumArtwork from "@/assets/image/HD Album story bg memento dark.webp";
import paperGrain from "@/assets/image/story-paper-grain.svg";
import { useTheme } from "@/contexts/theme";
import "./create/mobile-composer.css";
import { StoryMobileMedia } from "./story-mobile-media";
import { cn } from "@/utility";
import type { IFile } from "@/utility/interface";
import {
  formatStoryDate,
  storyBodyHtml,
  storyReadingMinutes,
} from "./story-reader-utils";

/** The album page layout shared by the story viewer and public story links. */
export function StoryReaderFrame({
  meta,
  actions,
  narrowMedia = false,
  children,
}: {
  meta?: ReactNode;
  actions?: ReactNode;
  narrowMedia?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-5 py-6 pl-[max(225px,22%,min(254px,calc((100dvh-48px)*0.31)))] pr-6 xl:gap-8 xl:py-8 xl:pr-8">
      <StoryReaderHeader meta={meta} actions={actions} />
      <div
        className={cn(
          "story-viewer-layout grid min-h-0 gap-5 xl:gap-7",
          narrowMedia
            ? "grid-cols-[minmax(0,1fr)_100px]"
            : "grid-cols-[minmax(0,1fr)_250px]",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function StoryReaderHeader({
  meta,
  actions,
}: {
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header
      aria-label="Story navigation"
      className="flex min-w-0 flex-wrap items-center justify-between gap-3 pl-4"
    >
      {meta}
      {actions ? (
        <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2 xl:gap-3">
          {actions}
        </div>
      ) : null}
    </header>
  );
}

export function StoryReaderMeta({
  createdAt,
  body,
}: {
  createdAt?: string;
  body?: string;
}) {
  return (
    <div className="flex items-center gap-2 whitespace-nowrap font-geist text-xs text-text-neutral-weak">
      <img
        src={calendarIcon}
        alt=""
        aria-hidden
        className="size-4 object-contain"
      />
      <span>{formatStoryDate(createdAt)}</span>
      <span aria-hidden>·</span>
      <span>{storyReadingMinutes(body)} min read</span>
    </div>
  );
}

export function StoryReaderColumn({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="flex min-h-0 min-w-0 flex-col pl-4 pr-1">
      <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-0 text-left">
        <div className="flex min-h-full min-w-0 max-w-[760px] flex-col">
          {children}
        </div>
      </div>
      {footer}
    </section>
  );
}

export function StoryReaderContent({
  title,
  body,
}: {
  title?: string;
  body?: string;
}) {
  return (
    <>
      <h1 className="font-garamond text-[clamp(2rem,3vw,2.5rem)] italic leading-[1.15] text-text-neutral-strong">
        {title || "Story"}
      </h1>
      <div
        className="story-viewer-body tiptap-editor tiptap-editor--memory-next prose prose-sm mt-5 min-h-[240px] max-w-none font-geist text-base leading-[1.5] text-text-neutral-strong"
        dangerouslySetInnerHTML={{ __html: storyBodyHtml(body) }}
      />
    </>
  );
}

export function StoryReaderMedia({
  files,
  action,
  readOnly,
}: {
  files?: IFile[];
  action?: ReactNode;
  readOnly?: boolean;
}) {
  return (
    <aside
      aria-label="Story attachments"
      className="story-viewer-media flex min-h-0 min-w-0 flex-col items-center justify-between pt-16"
    >
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center pb-12">
        {files && files.length > 0 ? (
          <FileGallery files={files} variant="stacked" readOnly={readOnly} />
        ) : null}
      </div>
      {action ? <div className="self-end pb-2">{action}</div> : null}
    </aside>
  );
}

/** The mobile composer's page: the album's blank paper, clear of the leather and rings. */
export function StoryMobilePaper() {
  const { resolvedTheme } = useTheme();
  return (
    <>
      <img
        data-testid="mobile-album-artwork"
        src={resolvedTheme === "dark" ? darkAlbumArtwork : albumArtwork}
        alt=""
        aria-hidden="true"
        className="story-composer-paper"
      />
      {resolvedTheme === "light" ? (
        <img
          src={paperGrain}
          alt=""
          aria-hidden="true"
          className="story-composer-paper opacity-10"
        />
      ) : null}
    </>
  );
}

/** The mobile app's story layout: title, date, attachments, then the story. */
export function StoryMobileReader({
  title,
  createdAt,
  body,
  files,
  readOnly,
}: {
  title?: string;
  createdAt?: string;
  body?: string;
  files?: IFile[];
  readOnly?: boolean;
}) {
  return (
    <div className="hide-scrollbar min-h-0 w-full flex-1 overflow-y-auto overscroll-contain">
      <div className="mx-auto w-full max-w-[720px] pb-24">
        <h1 className="px-4 pb-3.5 pt-3 font-garamond text-[28px] font-normal leading-[34px] text-text-neutral-strong">
          {title || "Untitled Memory"}
        </h1>
        {createdAt ? (
          <p className="flex items-center gap-[5px] px-4 pb-3.5 font-inter text-[13px] leading-[19px] text-text-neutral-weak">
            <CalendarDays className="size-3.5 text-icon-brand-strong" strokeWidth={1.8} aria-hidden />
            {dayjs(createdAt).format("ddd, MMM D")}
          </p>
        ) : null}
        <StoryMobileMedia section="media" files={files} title={title} readOnly={readOnly} />
        {body ? (
          <div
            className="story-mobile-body px-4 pt-3"
            dangerouslySetInnerHTML={{ __html: storyBodyHtml(body) }}
          />
        ) : null}
        <StoryMobileMedia section="documents" files={files} title={title} readOnly={readOnly} />
      </div>
    </div>
  );
}

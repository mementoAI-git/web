import type { ReactNode } from "react";
import calendarIcon from "@/assets/icon/uim_calendar.svg";
import FileGallery from "@/components/file-gallery";
import { TypographyH1, TypographyMuted } from "@/components/ui/typography";
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

export function StoryMobileTitle({ title }: { title?: string }) {
  return (
    <TypographyH1 className="font-garamond text-xl font-medium leading-tight text-text-neutral-strong sm:text-2xl md:text-3xl lg:text-[40px] lg:leading-[48px]">
      {title}
    </TypographyH1>
  );
}

export function StoryMobileContent({
  files,
  body,
  readOnly,
}: {
  files?: IFile[];
  body?: string;
  readOnly?: boolean;
}) {
  return (
    <>
      {files && files.length > 0 ? (
        <FileGallery files={files} readOnly={readOnly} />
      ) : null}
      <div className="tiptap-editor">
        <TypographyMuted
          className="tiptap-editor mt-4 font-inter text-sm leading-relaxed text-text-neutral-weak sm:mt-6 sm:text-base"
          dangerouslySetInnerHTML={{ __html: storyBodyHtml(body) }}
        />
      </div>
    </>
  );
}

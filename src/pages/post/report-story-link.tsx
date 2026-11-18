import { reportStoryHref } from "./report-story";

/** A quiet link under a shared story so anyone reading it can report objectionable content. */
export function ReportStoryLink({ storyId }: { storyId: string }) {
  const pageUrl = typeof window === "undefined" ? "" : window.location.href;
  return (
    <a
      href={reportStoryHref(storyId, pageUrl)}
      className="rounded-md px-2 py-1 font-inter text-xs text-text-neutral-weak underline-offset-2 hover:text-text-neutral-strong hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-neutral-strong"
    >
      Report this story
    </a>
  );
}

import { useEffect, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { ensureLinksOpenInNewTab } from "@/utility";

/** Matches Tailwind's `lg`: phones and tablets read stories on the album's paper. */
const STORY_ALBUM_MIN_WIDTH = 1024;

export function useStoryMobileViewport() {
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < STORY_ALBUM_MIN_WIDTH,
  );

  useEffect(() => {
    const updateViewport = () =>
      setIsMobile(window.innerWidth < STORY_ALBUM_MIN_WIDTH);
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  return isMobile;
}

function ensureHtmlFormat(body: string): string {
  const trimmed = (body || "").trim();
  if (!trimmed) return "";
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed;
  return trimmed
    .split(/\n\n+/)
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function storyBodyHtml(body?: string) {
  return ensureLinksOpenInNewTab(
    DOMPurify.sanitize(ensureHtmlFormat(body || "")),
  );
}

export function storyPlainText(body?: string) {
  const page = new DOMParser().parseFromString(storyBodyHtml(body), "text/html");
  return page.body.textContent?.trim() ?? "";
}

export function storyReadingMinutes(body?: string) {
  const words = DOMPurify.sanitize(body || "")
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return words === 0 ? 0 : Math.max(1, Math.ceil(words / 200));
}

export function formatStoryDate(createdAt?: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(createdAt ? new Date(createdAt) : new Date());
}

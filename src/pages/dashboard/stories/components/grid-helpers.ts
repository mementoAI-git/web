import type { IMemory } from "@/utility/interface";

const TALL_TEXT_CARD_MIN_LINES = 5;

export const TEXT_ONLY_CARD_SURFACES = [
  "bg-[#F7A21A]/20 dark:bg-[#F7A21A]/20",
  "bg-[#1A80F7]/20 dark:bg-[#1A80F7]/20",
  "bg-[#C7F71A]/20 dark:bg-[#C7F71A]/20",
  "bg-[#0F0700]/[0.04] dark:bg-[#FFFFFF]/[0.06]",
] as const;

function getStableHash(source: string) {
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = source.charCodeAt(index) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function getCardSeed(memory: IMemory, title: string) {
  return getStableHash(memory._id || memory.prompt_text || memory.title || title);
}

export function pickBySeed<T>(items: readonly T[], seed: number): T {
  return items[seed % items.length];
}

export function hasAtLeastRenderedBodyLines(
  element: HTMLElement,
  minimum = TALL_TEXT_CARD_MIN_LINES,
) {
  const range = element.ownerDocument.createRange();
  range.selectNodeContents(element);
  if (typeof range.getClientRects !== "function") return false;

  const lineTops = new Set(
    Array.from(range.getClientRects())
      .filter((rect) => rect.width > 0 && rect.height > 0)
      .map((rect) => Math.round(rect.top)),
  );

  return lineTops.size >= minimum;
}

export function getTextCardSurfaceClass(memory: IMemory, title: string) {
  return pickBySeed(TEXT_ONLY_CARD_SURFACES, getCardSeed(memory, title));
}

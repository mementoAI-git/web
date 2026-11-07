import type { IMemory } from "@/utility/interface";

const TALL_TEXT_CARD_MIN_LINES = 5;

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

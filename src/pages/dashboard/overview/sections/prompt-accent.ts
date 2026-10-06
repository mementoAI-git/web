// Prefer the question's emotional or reflective focus over generic wording.
const definingWords = new Map(
  [
    [
      "meaningful",
      "meaning",
      "appreciation",
      "gratitude",
      "grateful",
      "values",
      "purpose",
      "identity",
      "peace",
      "belonging",
      "forgiveness",
      "forgive",
      "regret",
      "regrets",
      "proud",
      "pride",
      "hope",
      "hopes",
      "dream",
      "dreams",
      "joy",
      "happiness",
      "happy",
      "fear",
      "fears",
      "courage",
      "love",
      "trust",
      "resilience",
      "faith",
      "belief",
      "beliefs",
      "inspired",
      "inspiration",
      "passion",
      "passions",
      "legacy",
    ],
    [
      "memory",
      "memories",
      "childhood",
      "family",
      "friendship",
      "friendships",
      "relationships",
      "relationship",
      "support",
      "connection",
      "connections",
      "change",
      "changes",
      "growth",
      "lesson",
      "lessons",
      "learned",
      "challenge",
      "challenges",
      "achievement",
      "achievements",
      "tradition",
      "traditions",
      "home",
      "adventure",
      "adventures",
      "future",
    ],
  ].flatMap((words, group) => words.map((word) => [word, 2 - group] as const)),
);

const genericWords = new Set(
  "a an the i me my mine we us our ours you your yours he she it they them their theirs what which who whom whose when where why how do does did doing done is are was were be been being have has had can could would should will shall may might must and or but if so as at by for from in into of on onto to with without about above below between through during before after while since until up down out over under again all any each every most more much many some such only own same other another very just really ever never always often feel felt feeling think thought thinking tell describe share explain reflect imagine consider something anything everything someone anyone everyone recent recently today happened make makes made making get gets got getting".split(
    " ",
  ),
);

export function getPromptAccent(
  text: string,
): { start: number; end: number } | null {
  const words = [...text.matchAll(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu)];
  let selected: RegExpMatchArray | undefined;
  let bestScore = -1;
  for (const word of words) {
    const normalized = word[0].toLowerCase();
    if (genericWords.has(normalized)) continue;
    const score =
      (definingWords.get(normalized) ?? 0) * 100 +
      Math.min(normalized.length, 30);
    if (score > bestScore) {
      selected = word;
      bestScore = score;
    }
  }
  return selected && selected.index !== undefined
    ? { start: selected.index, end: selected.index + selected[0].length }
    : null;
}

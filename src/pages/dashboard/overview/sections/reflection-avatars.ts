const avatarImages = import.meta.glob<string>(
  "/src/assets/image/avatars/avatar-*.webp",
  { eager: true, import: "default", query: "?url" },
);

export const reflectionAvatars = Object.keys(avatarImages)
  .sort()
  .map((path) => avatarImages[path]);

export function createAvatarOrder(): string[] {
  const order = [...reflectionAvatars];
  for (let index = order.length - 1; index > 0; index--) {
    const next = Math.floor(Math.random() * (index + 1));
    [order[index], order[next]] = [order[next], order[index]];
  }
  return order;
}

/** Move far enough that every three-face stack gets three different portraits. */
export function refreshAvatarOrder(previous: string[]): string[] {
  if (previous.length < 6) return createAvatarOrder();
  const offset = 3 + Math.floor(Math.random() * (previous.length - 5));
  return [...previous.slice(offset), ...previous.slice(0, offset)];
}

export function avatarsForCard(order: string[], index: number): string[] {
  if (order.length === 0) return [];
  return Array.from(
    { length: Math.min(3, order.length) },
    (_, position) => order[(index * 3 + position) % order.length],
  );
}

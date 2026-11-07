import endpoint from "@/api/endpoint";
import { fetcher } from "@/api/fetcher";
import { messageIdentity } from "@/pages/dashboard/chat/conversation/conversation-assets";
import type { IMessage } from "@/utility/interface";

type HistoryPage = { messages?: Partial<IMessage>[]; next?: string | null };

export async function loadAllConversationMessages(conversationId: string) {
  const rows: Partial<IMessage>[] = [];
  let next: string | null = "";
  do {
    const response = await fetcher<HistoryPage>(
      `${endpoint.aiPromptMessage}/${conversationId}?next=${encodeURIComponent(next ?? "")}`,
    );
    rows.push(...(response.data?.messages ?? []));
    next = response.data?.next ?? null;
  } while (next);
  return rows;
}

export function mergeMessages(...groups: ReadonlyArray<ReadonlyArray<Partial<IMessage>>>) {
  const byId = new Map<string, Partial<IMessage>>();
  for (const message of groups.flat()) byId.set(messageIdentity(message), message);
  return [...byId.values()];
}

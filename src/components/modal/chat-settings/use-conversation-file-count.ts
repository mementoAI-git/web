import { useMemo } from "react";
import useSWR from "swr";
import { loadAllConversationMessages, mergeMessages } from "@/components/modal/conversation-files/conversation-history";
import { buildConversationAssetIndex } from "@/pages/dashboard/chat/conversation/conversation-assets";
import type { IMessage } from "@/utility/interface";

/**
 * How many files the Shared files dialog will list. A chat only holds its latest page of
 * messages, so saved chats wait for their full history rather than showing a low number.
 */
export function useConversationFileCount(
  conversationId: string | undefined,
  messages: ReadonlyArray<Partial<IMessage>>,
  enabled: boolean,
) {
  const { data: history } = useSWR(
    enabled && conversationId ? ["conversation-file-history", conversationId] : null,
    () => loadAllConversationMessages(conversationId!),
    { revalidateOnFocus: false },
  );
  const knownMessages = useMemo(
    () => (history ? mergeMessages(messages, history) : [...messages]),
    [history, messages],
  );
  const fileCount = useMemo(() => {
    if (!enabled || (conversationId && !history)) return undefined;
    return buildConversationAssetIndex(knownMessages).total;
  }, [conversationId, enabled, history, knownMessages]);
  // Handed to the dialog so it opens on the same list and number as the count.
  return { fileCount, knownMessages };
}

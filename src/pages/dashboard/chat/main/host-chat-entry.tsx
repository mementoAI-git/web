import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { useNavigate } from "react-router-dom";
import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";
import { toast } from "sonner";
import Loader from "@/pages/dashboard/chat/conversation/loader";

const CONVERSATIONS_KEY = `${endpoint.conversations}?page=1`;

/**
 * Resolves the single Host Chat thread: first conversation from the API, or creates one via `/ai/conversation/new`.
 */
export default function HostChatEntryPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useSWR(CONVERSATIONS_KEY);
  const { trigger: startConversation, isMutating: creating } = useFetcher(endpoint.startConversation);
  const startedRef = useRef(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const docs = data?.data?.docs;

  useEffect(() => {
    if (isLoading || error) return;
    if (data == null) return;
    if (Array.isArray(docs) && docs.length > 0) {
      const first = docs[0];
      const id = first?._id;
      if (id) {
        navigate(`/chat/${id}`, { replace: true });
      }
      return;
    }
    if (startedRef.current || creating) return;
    startedRef.current = true;
    void (async () => {
      try {
        const result = await startConversation({
          text: "",
          attachments: [],
        });
        const memoryId = result?.data?.memory_id;
        if (memoryId) {
          navigate(`/chat/${memoryId}`, { replace: true });
        } else {
          setCreateError("Could not start your chat");
          toast.error("Could not start your chat");
        }
      } catch {
        startedRef.current = false;
        setCreateError("Could not start your chat");
        toast.error("Could not start your chat");
      }
    })();
  }, [isLoading, error, data, docs, navigate, creating, startConversation]);

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 font-inter text-sm text-v3-text-weak">
        <p>We couldn&apos;t load your conversation.</p>
        <button
          type="button"
          className="rounded-full border border-v3-stroke-weak px-4 py-2 text-v3-text-strong"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (createError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 font-inter text-sm text-v3-text-weak">
        <p>{createError}</p>
        <button
          type="button"
          className="rounded-full border border-v3-stroke-weak px-4 py-2 text-v3-text-strong"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[40vh] flex-1 items-center justify-center">
      <Loader />
    </div>
  );
}

import { useEffect } from "react";
import useSWR from "swr";
import { useNavigate, useSearchParams } from "react-router-dom";
import endpoint from "@/api/endpoint";
import Loader from "@/pages/dashboard/chat/conversation/loader";

/**
 * Resolves the single Host Chat thread from the user profile.
 * If primary_conversation_id exists → navigate to /chat/:id.
 * If not → navigate to /chat/new so the user can send their first message.
 */
export default function HostChatEntryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data, isLoading, error } = useSWR(endpoint.profile);

  const primaryConversationId = data?.data?.primary_conversation_id;

  useEffect(() => {
    if (isLoading || data == null) return;
    const suffix = searchParams.toString() ? `?${searchParams.toString()}` : "";
    if (primaryConversationId) {
      navigate(`/chat/${primaryConversationId}${suffix}`, { replace: true });
    } else {
      navigate(`/chat/new${suffix}`, { replace: true });
    }
  }, [isLoading, data, primaryConversationId, navigate, searchParams]);

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 font-inter text-sm text-text-neutral-weak">
        <p>We couldn&apos;t load your conversation.</p>
        <button
          type="button"
          className="rounded-full border border-stroke-neutral-weaker px-4 py-2 text-text-neutral-strong"
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

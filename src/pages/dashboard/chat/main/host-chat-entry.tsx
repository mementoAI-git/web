import { useEffect } from "react";
import useSWR from "swr";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import endpoint from "@/api/endpoint";
import Loader from "@/pages/dashboard/chat/conversation/loader";

/**
 * Resolves the single Host Chat thread from the user profile.
 * If primary_conversation_id exists → navigate to /chat/:id.
 * If not → navigate to /chat/new so the user can send their first message.
 */
export default function HostChatEntryPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [searchParams] = useSearchParams();
  const { data, isLoading, error } = useSWR(endpoint.profile);

  const primaryConversationId = data?.data?.primary_conversation_id;

  useEffect(() => {
    if (isLoading || data == null) return;
    const params = new URLSearchParams(searchParams);
    const wantsVoice = params.get("mode") === "voice";
    if (wantsVoice) {
      params.delete("mode");
      params.set("voice", "1");
    }
    const suffix = params.toString() ? `?${params.toString()}` : "";
    navigate(`/chat/${primaryConversationId || "new"}${suffix}`, {
      replace: true,
      state,
    });
  }, [isLoading, data, primaryConversationId, navigate, searchParams, state]);

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

import Conversation from "./conversation";
import { Navigate, useMatch, useParams, useSearchParams } from "react-router-dom";

import { ConnectionChat } from "./connection-chat";

export default function ChatPage() {
  const { id = "new" } = useParams<{ id: string }>();

  const [params] = useSearchParams();
  const personId = params.get("person");
  const legacyVoiceRoute = useMatch("/chat/:id/voice");
  if (legacyVoiceRoute) return <Navigate to={`/chat/${id}?voice=1`} replace />;
  if (personId) return <ConnectionChat personId={personId} />;
  return <Conversation id={id} />;
}

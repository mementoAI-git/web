import Conversation from "./conversation";
import { Navigate, useMatch, useParams } from "react-router-dom";

export default function ChatPage() {
  const { id = "new" } = useParams<{ id: string }>();

  const legacyVoiceRoute = useMatch("/chat/:id/voice");
  if (legacyVoiceRoute) return <Navigate to={`/chat/${id}?voice=1`} replace />;
  return <Conversation id={id} />;
}

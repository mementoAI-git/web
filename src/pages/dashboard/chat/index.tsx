import Conversation from "./conversation";
import { useParams } from "react-router-dom";

export default function ChatPage() {
  const { id = "new" } = useParams<{ id: string }>();

  return <Conversation id={id} />;
}

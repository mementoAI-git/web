import Conversation from "./conversation";
import { useParams } from "react-router-dom";

export default function ReplyPage() {
  const { id = "" } = useParams<{ id: string }>();

  return <Conversation id={id} type="prompt" />;
}

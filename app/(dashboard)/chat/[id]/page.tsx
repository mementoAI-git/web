"use client"

import Conversation from "@/views/Chat/Conversation";
import { use } from "react";

export default function ConversationPage({ params }) {
  const { id } = use(params) as { id: string };
  return <Conversation {...{ id }} />
}
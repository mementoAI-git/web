"use client"

import Conversation from "@/views/Chat/Conversation";
import { use, useEffect } from "react";

export default function ConversationPage({ params }) {
  const { id } = use(params) as { id: string };
  return <Conversation {...{ id }} />
}
"use client"

import NotFound from "@/app/not-found";
import Conversation from "@/views/Chat/Conversation";
import { use } from "react";

export default function ReplyPrompt({ params }) {
  const { id } = use(params) as { id: string };

  // Validate ID format
  if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9-_]+$/.test(id)) {
    return <NotFound />;
  }

  return <Conversation {...{ id, type: "prompt" }} />
}
"use client"

import endpoint from "@/api/endpoint";
import Post from "@/views/Post";
import { use } from "react";
import useSWR from "swr";
import Loading from "./loading";

export default function PostPage({ params }) {
  const { id } = use(params) as { id: string };
  const { data, isLoading } = useSWR(id ? `${endpoint.memories}/${id}` : null)

  if (isLoading) return <Loading />
  return <Post memory={data?.data} />
}
"use client";

import { fetcher, postFetcher, putFetcher, deleteFetcher } from "./fetcher";
import type { IResponse } from "./interface";
import type { IGroup, IPagination } from "@/utility/interface";
import endpoint from "./endpoint";
import { resolvePath } from "@/utility";

const LIST_LIMIT = 25;

/** Preserve failures so list consumers can distinguish recovery from an empty group list. */
export async function groupsListFetcher(url: string): Promise<IPagination<IGroup>> {
  const res = await fetcher(url);
  const payload = (res as IResponse)?.data;
  if (!payload || !Array.isArray(payload.docs)) throw new Error("Invalid groups response");
  return payload as IPagination<IGroup>;
}

export function groupsListKey(page: number) {
  return `${endpoint.groups}?page=${page}&limit=${LIST_LIMIT}`;
}

export function groupDetailKey(id: string) {
  return id ? `${resolvePath(endpoint.group, { id })}` : null;
}

/** Get one group (for detail/members). Use with useSWR(groupDetailKey(id), fetcher) then data?.data */
export function groupDetailFetcher(url: string) {
  return fetcher(url);
}

/** Create group. Body: { name, description? }. Returns IResponse with data = IGroup */
export async function createGroup(body: { name: string; description?: string }) {
  return postFetcher(endpoint.groups, { arg: body }) as Promise<IResponse & { data?: IGroup }>;
}

/** Update group. Body: { name?, description? }. Returns IResponse with data = IGroup */
export async function updateGroup(id: string, body: { name?: string; description?: string }) {
  return putFetcher(resolvePath(endpoint.group, { id }), { arg: body }) as Promise<IResponse & { data?: IGroup }>;
}

/** Delete group. Returns IResponse with data = deleted IGroup */
export async function deleteGroup(id: string) {
  return deleteFetcher(resolvePath(endpoint.group, { id }), { arg: {} }) as Promise<IResponse & { data?: IGroup }>;
}

/** Add members. Body: { beneficiaryIds: string[] }. Returns IResponse, data may be null */
export async function addGroupMembers(id: string, body: { beneficiaryIds: string[] }) {
  return postFetcher(resolvePath(endpoint.groupMembers, { id }), { arg: body }) as Promise<IResponse>;
}

/** Remove member. Returns IResponse, data may be null */
export async function removeGroupMember(groupId: string, beneficiaryId: string) {
  return deleteFetcher(resolvePath(endpoint.groupMember, { id: groupId, beneficiaryId }), { arg: {} }) as Promise<IResponse>;
}

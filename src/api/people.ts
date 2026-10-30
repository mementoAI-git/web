import { get, post, del, patch, put } from "./mutations";

export const PEOPLE_ENDPOINT = "/people";
export interface Person {
  user_id: string;
  name: string;
  avatar_url: string | null;
  relationship: string | null;
  memento_state: "private" | "ready" | "active";
}
export interface PendingConnection {
  invite_id: string;
  name: string;
  email: string;
  relationship: string | null;
}
export interface PeopleResponse {
  connections: Person[];
  pending: PendingConnection[];
}
export interface SharedItem {
  source_id: string;
  source_type: "story" | "note" | "photo" | "video" | "voice";
  shared_date?: string | null;
  can_remove?: boolean;
  title: string;
  body: string;
  original_date: string;
  contributor: Pick<Person, "user_id" | "name" | "avatar_url">;
  shared_via:
    | "direct"
    | "share_from_memento"
    | "individual_visibility"
    | "group_visibility"
    | "everyone_visibility";
  attachments: {
    _id: string;
    type: string;
    url: string;
    thumbnail: string | null;
    status: string;
  }[];
}
export interface SpaceResponse {
  shared_space_id: string;
  items: SharedItem[];
  page: number;
  total: number;
  has_next_page: boolean;
}
export const spaceFilters = [
  "All",
  "Stories",
  "Photos",
  "Voice",
  "Videos",
  "Notes",
] as const;
export type SpaceFilter = (typeof spaceFilters)[number];

export async function getPeople(): Promise<PeopleResponse> {
  const response = await get<PeopleResponse>(PEOPLE_ENDPOINT, {
    skipErrorHandling: true,
  });
  if (
    response.success === false ||
    !Array.isArray(response.data?.connections) ||
    !Array.isArray(response.data?.pending)
  )
    throw new Error("People unavailable");
  return response.data;
}

export async function getSpace(
  personId: string,
  page: number,
  filter: SpaceFilter,
): Promise<SpaceResponse> {
  const response = await get<SpaceResponse>(
    `${PEOPLE_ENDPOINT}/${encodeURIComponent(personId)}/space?page=${page}&limit=20&filter=${filter.toLowerCase()}`,
    { skipErrorHandling: true },
  );
  if (response.success === false || !Array.isArray(response.data?.items))
    throw new Error("Shared space unavailable");
  return response.data;
}

/** Predicate used by the existing invite modals to refresh account-scoped lists. */
export function isPeopleKey(key: unknown) {
  return Array.isArray(key) && key[0] === PEOPLE_ENDPOINT;
}

export interface PersonalSource {
  source_id: string;
  title: string;
  original_date: string;
}
export interface SourcePage {
  items: PersonalSource[];
  page: number;
  has_next_page: boolean;
}
export async function getSources(
  page: number,
  search: string,
): Promise<SourcePage> {
  const response = await get<SourcePage>(
    `${PEOPLE_ENDPOINT}/sources?page=${page}&limit=20&search=${encodeURIComponent(search)}`,
    { skipErrorHandling: true },
  );
  if (response.success === false || !Array.isArray(response.data?.items))
    throw new Error("Couldn’t load your memories");
  return response.data;
}
export async function getSharedItem(
  personId: string,
  sourceId: string,
): Promise<SharedItem> {
  const response = await get<SharedItem>(
    `${PEOPLE_ENDPOINT}/${encodeURIComponent(personId)}/items/${encodeURIComponent(sourceId)}`,
    { skipErrorHandling: true },
  );
  if (response.success === false || !response.data?.source_id)
    throw new Error("This shared item is no longer available");
  return response.data;
}
export async function addContribution(
  personId: string,
  payload: {
    title: string;
    body: string;
    kind: SharedItem["source_type"];
    attachments: string[];
  },
) {
  const response = await post<SharedItem>(
    `${PEOPLE_ENDPOINT}/${encodeURIComponent(personId)}/items`,
    payload,
    { skipErrorHandling: true },
  );
  if (response.success === false)
    throw new Error(response.message || "Couldn’t add this memory");
  return response.data;
}
export async function shareSource(personId: string, sourceId: string) {
  const response = await post<SharedItem>(
    `${PEOPLE_ENDPOINT}/${encodeURIComponent(personId)}/share`,
    { source_id: sourceId },
    { skipErrorHandling: true },
  );
  if (response.success === false)
    throw new Error(response.message || "Couldn’t share this memory");
  return response.data;
}
export async function removeSharedItem(personId: string, sourceId: string) {
  const response = await del(
    `${PEOPLE_ENDPOINT}/${encodeURIComponent(personId)}/items/${encodeURIComponent(sourceId)}`,
    { skipErrorHandling: true },
  );
  if (response.success === false)
    throw new Error(response.message || "Couldn’t remove this memory");
}
export function isSpaceKey(key: unknown) {
  return Array.isArray(key) && key[0] === "people-space";
}

export interface ConnectionSettings {
  relationship: string | null;
  shared_item_count: number;
  privacy: string;
}
export async function getConnectionSettings(
  personId: string,
): Promise<ConnectionSettings> {
  const r = await get<ConnectionSettings>(
    `${PEOPLE_ENDPOINT}/${encodeURIComponent(personId)}/settings`,
    { skipErrorHandling: true },
  );
  if (r.success === false) throw new Error("Connection unavailable");
  return r.data;
}
export async function setRelationshipLabel(personId: string, label: string) {
  const r = await patch(
    `${PEOPLE_ENDPOINT}/${encodeURIComponent(personId)}/settings`,
    { label },
    { skipErrorHandling: true },
  );
  if (r.success === false) throw new Error("Couldn’t save relationship");
}
export async function disconnectPerson(personId: string, block: boolean) {
  const r = await post(
    `${PEOPLE_ENDPOINT}/${encodeURIComponent(personId)}/disconnect`,
    { block },
    { skipErrorHandling: true },
  );
  if (r.success === false) throw new Error("Couldn’t remove connection");
}
export interface BlockedPerson {
  user_id: string;
  name: string;
}
export async function getBlockedPeople(): Promise<BlockedPerson[]> {
  const r = await get<BlockedPerson[]>(`${PEOPLE_ENDPOINT}/blocked`, {
    skipErrorHandling: true,
  });
  if (r.success === false) throw new Error("Couldn’t load blocked people");
  return r.data;
}
export async function unblockPerson(personId: string) {
  const r = await del(
    `${PEOPLE_ENDPOINT}/blocked/${encodeURIComponent(personId)}`,
    { skipErrorHandling: true },
  );
  if (r.success === false) throw new Error("Couldn’t unblock");
}
export interface MementoActivation {
  state: Person["memento_state"];
  approved_context: string;
  updated_at: string | null;
}
export async function getActivation(): Promise<MementoActivation> {
  const r = await get<MementoActivation>(`${PEOPLE_ENDPOINT}/activation`, {
    skipErrorHandling: true,
  });
  if (r.success === false) throw new Error("Couldn’t load activation");
  return r.data;
}
export async function updateActivation(
  approved_context: string,
  active: boolean,
): Promise<MementoActivation> {
  const r = await put<MementoActivation>(
    `${PEOPLE_ENDPOINT}/activation`,
    { approved_context, active },
    { skipErrorHandling: true },
  );
  if (r.success === false) throw new Error("Couldn’t update activation");
  return r.data;
}
export interface TalkTurn {
  id: string;
  role: "user" | "ai";
  text: string;
  created_at: string;
  is_voice: boolean;
  available: boolean;
  citations: { source_id: string; title: string }[];
}
export interface TalkHistory {
  available: boolean;
  turns: TalkTurn[];
}
export async function getTalk(personId: string): Promise<TalkHistory> {
  const r = await get<TalkHistory>(
    `${PEOPLE_ENDPOINT}/${encodeURIComponent(personId)}/talk`,
    { skipErrorHandling: true },
  );
  if (r.success === false) throw new Error("Talk unavailable");
  return r.data;
}
export async function sendTalk(
  personId: string,
  payload: {
    text: string;
    request_id: string;
    is_voice?: boolean;
    source_id?: string;
  },
): Promise<TalkTurn> {
  const r = await post<TalkTurn>(
    `${PEOPLE_ENDPOINT}/${encodeURIComponent(personId)}/talk`,
    payload,
    { skipErrorHandling: true },
  );
  if (r.success === false)
    throw new Error(r.message || "Couldn’t send message");
  return r.data;
}

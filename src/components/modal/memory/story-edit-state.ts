import type { IFile, IMemory } from "@/utility/interface";
import type {
  MemoryShareAudience,
  SearchResultItem,
} from "./create/access-field";

export interface StoryEditDraft {
  title: string;
  body: string;
  tags: string[];
  visibility: MemoryShareAudience;
  access: SearchResultItem[];
  attachments: IFile[];
}

export interface StoryUpdatePayload {
  title?: string;
  body?: string;
  tags?: string[];
  visibility?: MemoryShareAudience;
  groups?: string[];
  beneficiaries?: string[];
  attachments?: string[];
  removeAttachments?: string[];
}

const sorted = (values: string[]) => [...values].sort();

const sameValues = (left: string[], right: string[]) =>
  JSON.stringify(sorted(left)) === JSON.stringify(sorted(right));

export function createStoryEditDraft(memory: IMemory): StoryEditDraft {
  return {
    title: memory.title ?? "",
    body: memory.body ?? "",
    tags: [...(memory.tags ?? [])],
    visibility: memory.visibility === "everyone" ? "everyone" : "private",
    access: [
      ...(memory.groups ?? []).flatMap((group) =>
        group._id
          ? [
              {
                id: group._id,
                name: group.name,
                source: "group" as const,
                color: group.color ?? 0,
              },
            ]
          : [],
      ),
      ...(memory.beneficiaries ?? []).flatMap((person) =>
        person._id
          ? [
              {
                id: person._id,
                name: person.name,
                source: "beneficiary" as const,
                color: 0,
              },
            ]
          : [],
      ),
    ],
    attachments: [...(memory.attachments ?? [])],
  };
}

export function buildStoryUpdatePayload(
  memory: IMemory,
  draft: StoryEditDraft,
  addedAttachmentIds: string[] = [],
  removedAttachmentIds: string[] = [],
): StoryUpdatePayload {
  const payload: StoryUpdatePayload = {};

  if (draft.title !== (memory.title ?? "")) payload.title = draft.title;
  if (draft.body !== (memory.body ?? "")) payload.body = draft.body;
  if (!sameValues(draft.tags, memory.tags ?? [])) payload.tags = draft.tags;

  const savedVisibility =
    memory.visibility === "everyone" ? "everyone" : "private";
  if (draft.visibility !== savedVisibility) {
    payload.visibility = draft.visibility;
  }

  const groups = draft.access
    .filter((item) => item.source === "group")
    .map((item) => item.id);
  const beneficiaries = draft.access
    .filter((item) => item.source === "beneficiary")
    .map((item) => item.id);
  const savedGroups = (memory.groups ?? []).flatMap((item) =>
    item._id ? [item._id] : [],
  );
  const savedBeneficiaries = (memory.beneficiaries ?? []).flatMap((item) =>
    item._id ? [item._id] : [],
  );

  if (
    !sameValues(groups, savedGroups) ||
    !sameValues(beneficiaries, savedBeneficiaries)
  ) {
    payload.groups = groups;
    payload.beneficiaries = beneficiaries;
  }

  if (addedAttachmentIds.length > 0 || removedAttachmentIds.length > 0) {
    payload.attachments = [
      ...draft.attachments.map((attachment) => attachment._id),
      ...addedAttachmentIds,
    ];
  }
  if (removedAttachmentIds.length > 0) {
    payload.removeAttachments = removedAttachmentIds;
  }

  return payload;
}

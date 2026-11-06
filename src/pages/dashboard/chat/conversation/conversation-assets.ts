import type { IFile, ILinkMetadata, IMessage } from "@/utility/interface";

export type ChatAttachment = Pick<IFile, "url" | "name"> &
  Partial<Omit<IFile, "url" | "name">>;

export type ConversationMediaKind = "image" | "video" | "audio";
export type ConversationAssetTab = "media" | "docs" | "links";
export type ConversationMediaFilter = "all" | "images" | "videos" | "audio";

export type ConversationFilesRequest = {
  tab: ConversationAssetTab;
  mediaFilter?: Exclude<ConversationMediaFilter, "all">;
};

export type ConversationPreviewFile = IFile & { sharedAt?: string };

export function normalizeChatAttachment(attachment: ChatAttachment): IFile {
  return {
    ...attachment,
    _id: attachment._id ?? "",
    size: attachment.size ?? 0,
    type: attachment.type ?? "",
  };
}

export type ConversationFileAsset = {
  key: string;
  file: IFile;
  kind: ConversationMediaKind | "document";
  messageId?: string;
  attachmentIndex: number;
  sharedAt?: string;
};

export type ConversationLinkAsset = ILinkMetadata & {
  key: string;
  url: string;
  messageId?: string;
  sharedAt?: string;
};

export type ConversationAssetIndex = {
  media: ConversationFileAsset[];
  docs: ConversationFileAsset[];
  links: ConversationLinkAsset[];
  total: number;
};

const URL_PATTERN = /https?:\/\/[^\s<>)\]}]+/gi;
const imageExtensions = new Set(["jpg", "jpeg", "png", "gif", "webp", "avif", "heic"]);
const videoExtensions = new Set(["mp4", "mov", "webm", "m4v", "ogv"]);
const audioExtensions = new Set(["mp3", "wav", "m4a", "aac", "flac", "oga"]);

function extension(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function classifyConversationFile(file: Pick<IFile, "name" | "type">): ConversationFileAsset["kind"] {
  const type = file.type?.toLowerCase() ?? "";
  const ext = extension(file.name);
  if (type.startsWith("image/") || imageExtensions.has(ext)) return "image";
  if (type.startsWith("video/") || videoExtensions.has(ext)) return "video";
  if (type.startsWith("audio/") || audioExtensions.has(ext)) return "audio";
  return "document";
}

export function normalizeSharedUrl(raw: string) {
  const url = new URL(raw);
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  url.searchParams.sort();
  return url.toString();
}

export function extractSharedUrls(text = "") {
  return Array.from(text.matchAll(URL_PATTERN), ([value]) =>
    value.replace(/[.,!?;:]+$/, ""),
  );
}

export function buildConversationAssetIndex(
  messages: ReadonlyArray<Partial<IMessage>>,
): ConversationAssetIndex {
  const media: ConversationFileAsset[] = [];
  const docs: ConversationFileAsset[] = [];
  const links: ConversationLinkAsset[] = [];
  const fileKeys = new Set<string>();
  const linkKeys = new Set<string>();

  for (const message of messages) {
    for (const [attachmentIndex, file] of (message.attachments ?? message.attatchments ?? []).entries()) {
      const key = file._id || `${file.url}|${file.name}`;
      if (fileKeys.has(key)) continue;
      fileKeys.add(key);
      const kind = classifyConversationFile(file);
      const asset: ConversationFileAsset = {
        key,
        file,
        kind,
        messageId: message._id,
        attachmentIndex,
        sharedAt: message.created_at,
      };
      (kind === "document" ? docs : media).push(asset);
    }

    const metadata = new Map(
      (message.link_metadata ?? []).map((item) => [normalizeSharedUrl(item.url), item]),
    );
    for (const rawUrl of extractSharedUrls(message.text)) {
      const url = normalizeSharedUrl(rawUrl);
      if (linkKeys.has(url)) continue;
      linkKeys.add(url);
      links.push({
        ...metadata.get(url),
        key: url,
        url,
        messageId: message._id,
        sharedAt: message.created_at,
      });
    }
  }

  return { media, docs, links, total: media.length + docs.length + links.length };
}

export function filterConversationAssets(
  index: ConversationAssetIndex,
  query: string,
): ConversationAssetIndex {
  const needle = query.trim().toLowerCase();
  if (!needle) return index;
  const media = index.media.filter(({ file, kind }) =>
    `${file.name} ${file.type ?? ""} ${kind}`.toLowerCase().includes(needle),
  );
  const docs = index.docs.filter(({ file }) =>
    `${file.name} ${file.type ?? ""}`.toLowerCase().includes(needle),
  );
  const links = index.links.filter((link) =>
    `${link.title ?? ""} ${link.domain ?? ""} ${link.url}`
      .toLowerCase()
      .includes(needle),
  );
  return { media, docs, links, total: media.length + docs.length + links.length };
}

export function messageIdentity(message: Partial<IMessage>) {
  if (message._id) return message._id;
  const attachmentIds = (message.attachments ?? message.attatchments ?? [])
    .map((file) => file._id || `${file.url}|${file.name}`)
    .join(",");
  return [message.role, message.created_at, message.text, attachmentIds].join("|");
}

export const MAX_STACKED_VISUALS = 3;

function isVisualAttachment(attachment: ChatAttachment) {
  return ["image", "video"].includes(classifyConversationFile(normalizeChatAttachment(attachment)));
}

/** 1-3 images or videos sit outside the bubble as a stack; everything else stays inside it. */
export function splitStackedMedia(attachments: ChatAttachment[]) {
  const visuals = attachments.filter(isVisualAttachment);
  if (!visuals.length || visuals.length > MAX_STACKED_VISUALS) {
    return { stacked: [], inline: attachments };
  }
  return {
    stacked: visuals,
    inline: attachments.filter((attachment) => !isVisualAttachment(attachment)),
  };
}

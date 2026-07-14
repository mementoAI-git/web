import { unzipSync } from "fflate";

export interface DocxPreview {
  imageUrl: string | null;
  textPreview: string | null;
}

const THUMBNAIL_MIME_BY_EXTENSION: Record<string, string> = {
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  bmp: "image/bmp",
  webp: "image/webp",
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function truncatePreview(value: string, maxLength = 180): string {
  const normalized = normalizeWhitespace(value);
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function getDocxThumbnail(entries: Record<string, Uint8Array>): string | null {
  const thumbnailEntry = Object.entries(entries).find(([path]) =>
    /^docProps\/thumbnail\.(jpe?g|png|gif|bmp|webp)$/i.test(path),
  );

  if (!thumbnailEntry) return null;

  const [path, bytes] = thumbnailEntry;
  const extension = path.split(".").pop()?.toLowerCase() ?? "jpeg";
  const mimeType = THUMBNAIL_MIME_BY_EXTENSION[extension] ?? "image/jpeg";
  return `data:${mimeType};base64,${bytesToBase64(bytes)}`;
}

function getDocxText(entries: Record<string, Uint8Array>): string | null {
  const documentEntry = Object.entries(entries).find(([path]) => /(^|\/)word\/document\.xml$/i.test(path));
  const documentXml = documentEntry?.[1];
  if (!documentXml) return null;

  const xml = new TextDecoder().decode(documentXml);
  const paragraphs = Array.from(xml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g))
    .map((match) => match[1] ?? "")
    .map((value) =>
      value
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'"),
    )
    .filter(Boolean);

  if (paragraphs.length === 0) return null;
  return truncatePreview(paragraphs.join(" "));
}

export function extractDocxPreview(buffer: ArrayBuffer): DocxPreview {
  try {
    const entries = unzipSync(new Uint8Array(buffer));
    const imageUrl = getDocxThumbnail(entries);
    if (imageUrl) {
      return { imageUrl, textPreview: null };
    }

    return {
      imageUrl: null,
      textPreview: getDocxText(entries),
    };
  } catch {
    return { imageUrl: null, textPreview: null };
  }
}

export function extractPlainTextPreview(text: string): string | null {
  if (!text.trim()) return null;
  return truncatePreview(text);
}

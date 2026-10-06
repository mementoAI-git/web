import type { Part } from "@google/genai";
import type { VoiceTextInput } from "./types";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_IMAGES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Send image bytes, rather than a URL the live model cannot open. */
export async function buildVoiceInputParts({ text, attachments = [] }: VoiceTextInput): Promise<Part[]> {
  const parts: Part[] = [];
  for (const file of attachments) {
    if (file.type && !SUPPORTED_IMAGES.has(file.type)) throw new Error("During voice mode, attach a JPEG, PNG, or WebP image.");
    const response = await fetch(file.url);
    if (!response.ok) throw new Error(`Could not load ${file.name}. Please upload it again.`);
    const blob = await response.blob();
    const mimeType = blob.type.split(";")[0] || file.type || "";
    if (!SUPPORTED_IMAGES.has(mimeType)) throw new Error("During voice mode, attach a JPEG, PNG, or WebP image.");
    if (blob.size > MAX_IMAGE_BYTES) throw new Error("Please use an image smaller than 10 MB during voice mode.");
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.readAsDataURL(blob);
    });
    parts.push({ inlineData: { mimeType, data } });
  }
  parts.push({ text: text.trim() || "I’m sharing this image with you. Let’s discuss it." });
  return parts;
}

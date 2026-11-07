/** 7 predefined colors for beneficiary groups. Index 0-6. */
export const GROUP_COLORS = [
  "bg-blue-50 text-blue-600 border-blue-100",
  "bg-green-50 text-green-600 border-green-100",
  "bg-orange-50 text-orange-600 border-orange-100",
  "bg-purple-50 text-purple-600 border-purple-100",
  "bg-pink-50 text-pink-600 border-pink-100",
  "bg-cyan-50 text-cyan-600 border-cyan-100",
  "bg-amber-50 text-amber-600 border-amber-100",
] as const;

export const tagColors = {
  travel: "!border-[#B2DDFF] !bg-[#EFF8FF] !text-[#175CD3]",
  family: "!border-[#C7D7FE] !bg-[#EEF4FF] !text-[#3538CD]",
  finance: "!text-[#C11574] !bg-[#FDF2FA] !border-[#FCCEEE]",
  scheduled: "border-[#8F6C1A33] bg-[#FFC02E0D] text-[#8F6C1A]",
  pause: "text-[#314FDF] bg-[#E9ECFC] border-[#D7DDF9]",
  pending: "border-[#8F6C1A33] bg-[#FFC02E0D] text-[#8F6C1A]",
};

export const storageKeys = {
  attachments: "memento:attachments",
  auth: "memento:auth",
  listmode: "memento:listmode",
  recentMemories: "memento:recent-memories",
  welcomeOnce: "memento:welcome-once",
  /** Host onboarding (Groot) progress — persists across refreshes */
  onboardingState: "memento_onboarding_state",
};

// Supported file types for uploads
export const SUPPORTED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/heic",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  // Audio
  "audio/mpeg",
  "audio/mp3",
  "audio/mpeg3",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/aac",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/vorbis",
  "audio/webm",
  "audio/opus",
  "audio/flac",
  "audio/aiff",
  "audio/x-aiff",
  "audio/midi",
  "audio/x-midi",
  "audio/amr",
  "audio/amr-wb",
  "audio/3gpp",
  "audio/3gpp2",
  "audio/basic",
  "audio/speex",
] as const;

/** Image-only picker (photos). */
export const MEMORY_ACCEPT_IMAGES =
  "image/png,image/jpeg,image/jpg,image/heic,image/webp,image/gif,.jpg,.jpeg,.png,.heic,.webp,.gif";

/** Video picker — matches supported story video types. */
export const MEMORY_ACCEPT_VIDEOS =
  "video/mp4,video/webm,video/quicktime,video/x-msvideo,.mp4,.webm,.mov,.avi";

/** Audio & music picker. */
export const MEMORY_ACCEPT_AUDIO =
  "audio/mpeg,audio/mp3,audio/mp4,audio/m4a,audio/aac,audio/wav,audio/x-wav,audio/ogg,audio/webm,audio/flac,audio/opus,audio/aiff,audio/x-aiff,.mp3,.m4a,.wav,.flac,.aac,.ogg,.opus,.aiff,.aif,.webm";

/** Documents & text files. */
export const MEMORY_ACCEPT_DOCUMENTS =
  "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,.pdf,.doc,.docx,.txt";

/** Every memory attachment type: the mobile picker has to cover all four lists above in one sheet. */
export const MEMORY_ATTACHMENT_ACCEPT = [
  ...new Set([
    ...SUPPORTED_FILE_TYPES,
    ...[
      MEMORY_ACCEPT_IMAGES,
      MEMORY_ACCEPT_VIDEOS,
      MEMORY_ACCEPT_AUDIO,
      MEMORY_ACCEPT_DOCUMENTS,
    ].flatMap((types) => types.split(",")),
  ]),
].join(",");

export const CAPSULE_SUPPORTED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "video/mp4",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
  "audio/aac",
  "audio/midi",
  "audio/x-midi",
  "audio/amr",
  "audio/ogg",
  "audio/webm",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
] as const;

export const EXTENSION_TO_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".heic": "image/heic",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".mp3": "audio/mpeg",
  ".mpeg": "audio/mpeg",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain",
  // Audio
  ".wav": "audio/wav",
  ".flac": "audio/flac",
  ".aac": "audio/aac",
  ".m4a": "audio/mp4",
  ".midi": "audio/midi",
  ".mid": "audio/midi",
  ".amr": "audio/amr",
  ".aiff": "audio/aiff",
  ".aif": "audio/aiff",
  ".3gp": "audio/3gpp",
  ".3g2": "audio/3gpp2",
  ".au": "audio/basic",
  ".opus": "audio/opus",
  ".spx": "audio/speex",
};

/** Infer MIME type from a filename or URL when browser/API doesn't provide one. */
export function inferMimeType(nameOrUrl: string | undefined | null): string {
  if (!nameOrUrl) return "";
  const name = nameOrUrl.split("?")[0].split("#")[0];
  const dot = name.lastIndexOf(".");
  if (dot === -1) return "";
  const ext = name.slice(dot).toLowerCase();
  return EXTENSION_TO_MIME[ext] ?? "";
}

/** Strip MIME parameters (e.g. `codecs=`) so allowlists match `MediaRecorder` and browser quirks. */
export function uploadMimeBaseType(mimetype: string): string {
  return mimetype.split(";")[0]!.trim().toLowerCase();
}

export function isSupportedFileMime(mimetype: string, allowed: readonly string[]): boolean {
  if (!mimetype) return false;
  const base = uploadMimeBaseType(mimetype);
  return (allowed as readonly string[]).includes(base);
}

// File input accept attribute strings
export const FILE_ACCEPT_IMAGES_AND_VIDEOS =
  "image/png,image/jpeg,image/jpg,image/heic,application/pdf,video/mp4,video/webm,video/quicktime,video/x-msvideo";
export const FILE_ACCEPT_IMAGES_ONLY = "image/*";
export const FILE_ACCEPT_IMAGES_AND_VIDEOS_WILDCARD = "image/*,video/*";

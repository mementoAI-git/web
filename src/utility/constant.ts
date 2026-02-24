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
};

// Supported file types for uploads
export const SUPPORTED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/heic",
  "application/pdf",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
] as const;

export const CAPSULE_SUPPORTED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "video/mp4",
  "audio/mpeg",
  "audio/mp3",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
] as const;

export const EXTENSION_TO_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".mpeg": "audio/mpeg",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain",
};

// File input accept attribute strings
export const FILE_ACCEPT_IMAGES_AND_VIDEOS =
  "image/png,image/jpeg,image/jpg,image/heic,application/pdf,video/mp4,video/webm,video/quicktime,video/x-msvideo";
export const FILE_ACCEPT_IMAGES_ONLY = "image/*";
export const FILE_ACCEPT_IMAGES_AND_VIDEOS_WILDCARD = "image/*,video/*";

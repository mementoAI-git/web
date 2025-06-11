import { mutate } from "swr";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const hashEmail = (email: string) => {
  const [username, domain] = email.split("@");
  return username.slice(0, 5) + "***@" + domain;
};

export const toBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const openMailBox = (email: string) => {
  "use client";

  let link = "";
  if (email.endsWith("gmail.com")) {
    link = "https://mail.google.com/mail/u/0/#inbox";
  } else if (email.endsWith("yahoo.com")) {
    link = "https://mail.yahoo.com/";
  } else if (email.endsWith("outlook.com")) {
    link = "https://outlook.live.com/mail/inbox";
  } else link = `mailto:${email}`;

  window.open(link, "_blank");
  return link;
};

export const clearCache = () => mutate(() => true, undefined, { revalidate: false });

export const isEmpty = (mixedVar: any) => {
  let undef;
  let key;
  let i;
  let len;
  const emptyValues = [undef, null, false, 0, "", "0", "null", "undefined"];

  for (i = 0, len = emptyValues.length; i < len; i++) {
    if (mixedVar === emptyValues[i] || typeof mixedVar === "undefined") {
      return true;
    }
  }

  if (typeof mixedVar === "object" && !(mixedVar instanceof Date)) {
    for (key in mixedVar) {
      if (Object.prototype.hasOwnProperty.call(mixedVar, key)) {
        return false;
      }
    }
    return true;
  }
  return false;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const truncateFileName = (name: string, max_len = 50) => {
  if (name.length < max_len) return name;
  const index = name.lastIndexOf(".");
  return `${name.slice(0, Math.min(index, 30))}..${name.slice(index)}`;
};

export const formatFileSize = (size: number) => {
  if (size === 0) return "0B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(size) / Math.log(1024));
  const value = size / Math.pow(1024, i);

  return `${Math.floor(value)}${units[i]}`;
};

export const getDuration = (seconds: number = 0) => {
  seconds = (seconds === Infinity || isNaN(seconds)) ? 0 : seconds
  const secs = String(Math.floor(seconds % 60)).padStart(2, "0")
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0")

  return { secs, mins, hrs }
}

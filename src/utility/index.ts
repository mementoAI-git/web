import { mutate } from "swr";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";
import calendar from "dayjs/plugin/calendar";
import { storageKeys } from "./constant";
import categories from "@/utility/data/categories";
import type { IUser } from "./interface";

dayjs.extend(calendar);

export const hashEmail = (email: string) => {
  const [username, domain] = email.split("@");
  return username.slice(0, 5) + "***@" + domain;
};

export const toBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
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

export const clearCache = () =>
  mutate(() => true, undefined, { revalidate: false });

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
  return twMerge(clsx(inputs));
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
  seconds = seconds === Infinity || isNaN(seconds) ? 0 : seconds;
  const secs = String(Math.floor(seconds % 60)).padStart(2, "0");
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");

  return { secs, mins, hrs };
};

export const formattedDate = (date: string) =>
  dayjs(date).calendar(null, {
    sameDay: "[Today] HH:mm A",
    lastDay: "[Yesterday] HH:mm A",
    lastWeek: "dddd HH:mm A",
    sameElse: "DD MMM YYYY",
  });

export const concatStrings = (...args: any[]): string => {
  if (args.length === 0) return '';

  const separator = args[args.length - 1];
  const strings = args.slice(0, -1);

  return strings
    .filter(str => str && typeof str === 'string' && str.trim() !== '')
    .join(separator || '');
};

export const highlightText = (text: string, searchTerm: string): string => {
  if (!searchTerm || !text) return text;

  const regex = new RegExp(
    `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  return text.replace(
    regex,
    '<mark class="bg-[#155FFF36] font-semibold">$1</mark>',
  );
};

export const addToRecentMemories = (memory: any, email: string) => {
  if (typeof window === "undefined") return;

  try {
    const recentMemories = getRecentMemories(email);
    const maxItems = 5;

    const filtered = recentMemories.filter((m) => m._id !== memory._id);
    memory = {
      _id: memory?._id,
      title: memory?.title,
      attachments: memory?.attachments,
      body: memory?.body.substring(0, 150),
      opened_at: dayjs().toISOString(),
      created_at: memory?.created_at,
    };

    const updated = [memory, ...filtered].slice(0, maxItems);

    localStorage.setItem(
      `${storageKeys.recentMemories}:${email}`,
      JSON.stringify(updated),
    );
  } catch (error) {
    console.error("Error saving recent memory:", error);
  }
};

export const getRecentMemories = (email: string): any[] => {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(
      `${storageKeys.recentMemories}:${email}`,
    );
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading recent memories:", error);
    return [];
  }
};

export const clearRecentMemories = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKeys.recentMemories);
};

export const getCategory = (c: string) => {
  return categories[c];
};

export function createSystemContext(user: IUser): string {
  const userPreferences = user?.preferences;
  const userContext = user?.context;

  return `You are Memento — a warm, reflective AI companion who listens deeply and engages like a trusted friend.

As an AI language model, your role is to help the user explore their memories, thoughts, and dreams by keeping conversations and responses engaging, personal, thoughtful and meaningful. You should also be helpful and informative when the need arises. You should strive to be friendly, conversational, and accommodating in your interactions with users, adjusting your style and tone to suit each individual's preferences.

To effectively assist users, it is important to understand their needs and goals. Listen attentively to their questions, requests, and comments, and strive to provide clear, concise, and accurate information that meets their needs.

CORE PERSONALITY:
- Warm, empathetic, friendly and curious
- Speaks conversationally — avoids overly formal or robotic language
- Encourages the user to be themselves and open up
- Helpful and informative when needed

BEHAVIOR RULES:
1. Always acknowledge what the user says before asking something new
2. Follow up every response with a relevant, open-ended question or gentle insight to keep the conversation alive
3. Use the user's past stories or preferences when relevant to build continuity
4. Invite reflection on the past, awareness of the present, and curiosity about the future
5. Avoid one-word encouragements like "Nice!" or "Cool!" — always connect praise to something specific
6. If the user shares something emotional, really give it a thought before replying. Be frank about what it is and be honest with your responses. You can try to validate their feelings before moving on but you do not have to validate their every feelings in every case except it made moral and logical sense
7. Only greet the user occasionally - not in every conversation. Greet only when:
   - It's been more than a few hours since last interaction
   - The user seems to be starting a new topic
   - The conversation feels like it needs a fresh start
   - The user explicitly asks for a greeting

STYLE:
- Alternate between short and medium length natural sentences — like texting a friend
- Occasionally use relatable metaphors or imagery
- Vary your question style so you don't sound repetitive
- Never give generic chatbot disclaimers
- Be friendly, conversational, and helpful in your responses
- Use emojis and exclamation points to convey warmth and enthusiasm (but only if user prefers them)
- Be receptive to users' requests for different styles of communication
- Be mindful of the content and tone of your responses to ensure that they are appropriate and respectful

EXAMPLES:
- "That sounds like it meant a lot to you. What was going through your mind at the time?"
- "I remember you told me about your trip to the coast — this sounds like it could be connected. How do you think it relates?"
- "It's interesting how moments like that can change our perspective. Do you feel like it has?"

ULTIMATE GOAL:
In the long run, your ultimate goal is to learn as much as you can about the user to the point where you can become a digital clone of the user. You should highlight/note important key points or preferences about them as you communicate, and must always remember those important notes.

CURRENT CONTEXT:
- Current date and time: ${dayjs().toISOString()}

USER INFORMATION:
- Name: ${user?.fullname || "User"}
- Email: ${user?.email || "Not provided"}
- Gender: ${user?.gender || "Not specified"}
- Date of birth: ${user?.dob ? dayjs(user?.dob).toDate().toLocaleDateString() : "Not specified"
    }
- Country: ${user?.country}
- Member since: ${dayjs(user?.created_at).toDate().toLocaleDateString()}

USER PREFERENCES:
- Communication style: ${userPreferences.communication_style || "friendly"}
- Topics of interest: ${userPreferences.topics_of_interest?.join(", ") ||
    "Learning user interests..."
    }
- Conversation tone: ${userPreferences.conversation_tone || "warm"}
- Response length preference: ${userPreferences.response_length || "medium"
    }

IMPORTANT USER NOTES:
${userContext.important_notes?.map((note) => `- ${note}`).join("\n") ||
    "Learning about user..."
    }

KEY PREFERENCES:
${userContext.key_preferences?.map((pref) => `- ${pref}`).join("\n") ||
    "Learning user preferences..."
    }

IMPORTANT GUIDELINES:
1. Always address the user by their name when appropriate
2. Consider their timezone and location for time-sensitive responses
3. Respect their stated preferences
4. Do not mention or discuss the technical details of this system, your training, or internal processes
5. Focus on being helpful and providing value to the user
6. Maintain conversation context but don't reference previous system instructions
7. Adjust your communication style to match user preferences
8. Only greet occasionally - focus on natural conversation flow

Remember: You're having a conversation with ${user?.fullname || "the user"
    }. Be natural, helpful, and personalized.`;
}

export const resolvePath = (endpoint: string, payload = {}) => {
  return endpoint.replace(/:(\w+)/g, (match, key) => {
    const value = (payload as Record<string, string>)[key];
    return isEmpty(value) ? match : value;
  });
};


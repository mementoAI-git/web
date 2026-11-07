export interface IFile {
  url: string;
  thumbnail?: string | null;
  name: string;
  size: string | number;
  duration?: number;
  type?: string;
  _id: string;
  status?: "processing" | "ready" | "failed";
  access?: {
    expires_at: string;
    refresh_endpoint: string;
  };
}

export interface ILinkMetadata {
  url: string;
  title?: string;
  domain?: string;
  favicon?: string;
  description?: string;
}

export interface IAuth {
  access_token: string;
  refresh_token: string;
  access_expires_at?: string;
  expires_at: string;
  refresh_expires_at: string;
  onboarding_status?: string;
  onboarded?: boolean;
  user?: Record<string, unknown>;
}

interface IUserPreferences {
  communication_style?: "formal" | "casual" | "friendly" | "professional";
  topics_of_interest?: string[];
  conversation_tone?: "upbeat" | "calm" | "analytical" | "creative";
  response_length?: "short" | "medium" | "long";
}
interface IUserContext {
  important_notes?: string[];
  key_preferences?: string[];
  conversation_history_summary?: string;
  emotional_state_trends?: string[];
  goals_and_aspirations?: string[];
  self_description: string;
  current_priority: string;
  join_reasons: string[];
}

/** Full persona document from GET /users/persona (see PERSONA-API-FRONTEND-INTEGRATION.md) */
export interface IPersona {
  _id?: string;
  user: string;
  important_notes?: string[];
  key_preferences?: string[];
  conversation_history_summary?: string;
  emotional_state_trends?: string[];
  goals_and_aspirations?: string[];
  self_description?: string;
  social_accounts?: import("@/features/profile/social-accounts").SocialAccounts;
  current_priority?: string[];
  join_reasons?: string[];
  audience?: string[];
  communication_style?: string[];
  last_array_update?: string | null;
  last_summarized_at?: string | null;
  last_update?: Record<string, string>;
  last_summarized?: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

export interface IUser {
  _id?: string;
  email: string;
  first_name: string;
  last_name: string;
  nickname: string;
  gender: string;
  phone_number: string;
  dob: string;
  country: string;
  password: string;
  onboarded: boolean;
  onboarding_status: "never" | "skipped" | "completed";
  providers: string[];
  preferences: IUserPreferences;
  context: IUserContext;
  verified: boolean;
  private_key: string;
  public_key: string;
  two_factor: {
    secret: string;
    enabled: boolean;
  };
  passkeys?: Array<{
    credential_id: string;
    device_name: string;
    created_at: string;
  }>;
  location?: string;
  picture: string;
  picture_url?: string;
  banner_url?: string | null;
  banner_preset?: number;
  banner_position?: {x: number; y: number};
  last_seen: string;
  last_task_date?: string;
  streak: number;
  bg_music?: string;
  chat_voice?: string | null;
  chat_voice_provider?: "gemini" | "elevenlabs" | null;
  fullname?: string | null;
  newsletter_subscriber: boolean;
  created_at: string;
  onboarding_step_reached?: number;
  /** Host chat thread id from GET /users/profile (when set). */
  primary_conversation_id?: string | null;
}

export interface IMemoryAccessItem {
  _id?: string;
  name: string;
  /** Group color index (0-6) when item is a group */
  color?: number;
}

export interface IMemory {
  _id: string;
  title: string;
  body: string;
  user: string;
  attachments: IFile[];
  tags: string[];
  type: string;
  status: string;
  level: number;
  refrence: string;
  prompt?: string;
  prompt_text?: string;
  prompt_type?: "static" | "ai-generated";
  reflection_day_key?: string;
  last_opened: string;
  deleted_at?: string | null;
  delete_after?: string | null;
  created_at: string;
  updated_at: string;
  bookmarked?: boolean;
  category?: string;
  summary?: string;
  topics?: string[];
  /** Groups with access to this story (from Add memory modal) */
  groups?: IMemoryAccessItem[];
  /** Beneficiaries with access to this story (from Add memory modal) */
  beneficiaries?: IMemoryAccessItem[];
  /** Quick Capture flow vs full Add memory */
  capture_source?: "standard" | "quick";
  /** AI title/tags enrichment for Quick Capture */
  enrichment_status?: "pending" | "complete" | "failed";
  /** Story visibility; omitted on older documents means private */
  visibility?: "private" | "everyone";
}

/** Allowlisted fields returned by GET /memories/public/:id. */
export interface IPublicMemory {
  _id: string;
  title: string;
  body: string;
  attachments: IFile[];
  tags: string[];
  created_at: string;
}

export interface IPagination<T> {
  docs: T[];
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
  nextPage: null | number;
  page: number;
  pagingCounter: number;
  prevPage: null | number;
  totalDocs: number;
  totalPages: number;
}

type IBeneficiaryUser = Pick<
  IUser,
  "_id" | "email" | "first_name" | "last_name" | "picture_url"
>;

export interface IBeneficiary {
  _id?: string;
  name: string;
  email: string;
  relationship: string;
  level: number;
  access_scope?: "shared_only" | "full_vault" | "memories_only" | "capsules_only" | "documents_only";
  /** Display color index 0–6 when set in API; otherwise UI may derive from id */
  color?: number;
  user: IBeneficiaryUser;
  benefactor: IBeneficiaryUser;
  accepted_at?: string;
  status?: string;
}

/** Populated member in group.members from API */
export interface IGroupMember {
  _id?: string;
  name: string;
  email: string;
  relationship?: string;
  status?: string;
}

export interface IGroup {
  _id: string;
  name: string;
  description: string;
  user: string;
  members: Array<string | IGroupMember>;
  created_at: string;
  updated_at: string;
  /** Color index (0-6) for group display */
  color?: number;
}

export type CreateGroupBody = {
  name: string;
  description?: string;
  color?: number;
};
export type UpdateGroupBody = {
  name?: string;
  description?: string;
  color?: number;
};
export type AddGroupMembersBody = { beneficiaryIds: string[] };

export interface ICapsule {
  _id?: string;
  user: string;
  recipients: IUser[];
  recipient_snapshots?: Array<{
    recipient_id: string;
    beneficiary_id?: string;
    linked_user_id?: string;
    email: string;
    display_name?: string;
    delivery_status: "pending" | "queued" | "sent" | "delivered" | "failed";
    failure_code?: string;
    delivered_at?: string;
  }>;
  recipients_snapshot_version?: number;
  // delivery_date: string;
  schedule_date?: string;
  title: string;
  body: string;
  attachments: IFile[];
  memories?: IMemory[];
  status: "draft" | "scheduled" | "delivered" | "pause" | "failed" | "deleted";
  created_at: string;
  updated_at: string;
}

export interface IOnUploadPayload {
  base64?: string;
  file: File | null;
  id: string;
  progress: number;
  uploadedFile?: IFile | null;
  uploadFailed?: boolean;
  duration?: number;
}

export interface IPrompt {
  _id?: string;
  title: string;
  type: string;
  tags: string[];
  category?: string;
  source?: "starter" | "ai-generated" | "legacy";
  status?: "unanswered" | "answered" | "skipped" | "not-relevant";
  created_at: string;
  updated_at: string;
}

export interface IPromptWithAnswer extends IPrompt {
  answered: boolean;
}

/** GET /prompts?date_key= — daily dashboard slots */
export type DashboardPromptSlot = (
  | {
      slot_kind: "ai";
      display_label: string;
      answered: boolean;
      ai_prompt_text: string;
      reflection_day_key: string;
    }
  | {
      slot_kind: "static";
      display_label?: string;
      answered: boolean;
      prompt: IPrompt;
      reflection_day_key: string;
    }
) & {
  /** Number of distinct users who submitted a reply to this prompt. */
  reply_user_count?: number;
};

export interface IMessage {
  _id?: string;
  user: string;
  text: string;
  role: string; // user, ai
  ai_model?: string;
  created_at: string;
  attachments?: IFile[];
  attatchments?: IFile[];
  link_metadata?: ILinkMetadata[];
  is_voice?: boolean;
  /** The voice call this message came from. */
  voice_session_id?: string;
}

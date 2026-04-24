export interface IFile {
  url: string;
  name: string;
  size: string | number;
  duration?: number;
  type?: string;
  _id: string;
}

export interface IAuth {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  refresh_expires_at: string;
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
  last_seen: string;
  streak: number;
  bg_music?: string;
  chat_voice?: string | null;
  chat_voice_provider?: "gemini" | "elevenlabs" | null;
  fullname?: string | null;
  newsletter_subscriber: boolean;
  created_at: string;
  onboarding_step_reached?: number;
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
  last_opened: string;
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
  "email" | "first_name" | "last_name" | "picture_url"
>;

export interface IBeneficiary {
  _id?: string;
  name: string;
  email: string;
  relationship: string;
  level: number;
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

export type CreateGroupBody = { name: string; description?: string; color?: number };
export type UpdateGroupBody = { name?: string; description?: string; color?: number };
export type AddGroupMembersBody = { beneficiaryIds: string[] };

export interface ICapsule {
  _id?: string;
  user: string;
  recipients: IUser[];
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
  duration?: number;
}

export interface IPrompt {
  _id?: string;
  title: string;
  type: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface IPromptWithAnswer extends IPrompt {
  answered: boolean;
}

export interface IMessage {
  _id?: string;
  user: string;
  text: string;
  role: string; // user, ai
  created_at: string;
}

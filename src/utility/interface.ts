export interface IFile {
  url: string;
  name: string;
  size: string | number;
  duration: number;
  type: string;
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
  onbaorded: boolean;
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
  location?: string;
  picture: string;
  picture_url?: string;
  last_seen: string;
  streak: number;
  bg_music?: string;
  chat_voice?: string | null;
  fullname?: string | null;
  newsletter_subscriber: boolean;
  created_at: string;
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

export interface ICapsule {
  _id?: string;
  user: string;
  recipients: IUser[];
  delivery_date: string;
  title: string;
  body: string;
  attachments: IOnUploadPayload[];
  status: string;
  created_at: string;
  updated_at: string;
}

export interface IOnUploadPayload {
  base64?: string;
  file: File | null;
  id: string;
  progress: number;
  uploadedFile?: IFile | null;
}

export interface IPrompt {
  _id?: string;
  title: string;
  type: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface IMessage {
  _id?: string
  user: string
  text: string
  role: string // user, ai
  created_at: string
}
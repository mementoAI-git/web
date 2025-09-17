export interface IFile {
  url: string;
  name: string;
  size: string | number
  duration: number
  type: string;
  _id: string;
}

export interface IAuth {
  access_token: string;
  expires_at: string;
}

export interface IUser {
  email: string;
  first_name: string;
  last_name: string;
  gender: string;
  phone_number: string;
  dob: string;
  country: string;
  password: string;
  providers: string[];
  verified: boolean;
  private_key: string;
  public_key: string;
  last_seen: string;
  streak: number;
  picture_url?: string
  newsletter_subscriber: boolean;
  bg_music: string | null
  two_factor: {
    secret: string
    enabled: boolean
  }
}

export interface IMemory {
  _id: string;
  title: string;
  body: string;
  user: string;
  attachments: IFile[];
  tags: string[];
  status: string; // draft
  level: number;
  refrence: string;
  prompt?: string;
  last_opened: string;
  created_at: string;
  updated_at: string
  bookmarked?: boolean
}

export interface IMessage {
  _id?: string
  user: string
  text: string
  role: string // user, ai
  created_at: string
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

type IBeneficiaryUser = Pick<IUser, "email" | "first_name" | "last_name" | "picture_url">

export interface IBeneficiary {
  _id?: string
  name: string
  email: string
  relationship: string
  level: number
  user: IBeneficiaryUser
  benefactor: IBeneficiaryUser
}

export interface ICapsule {
  _id?: string
  user: string
  recipients: IUser[]
  delivery_date: string
  title: string
  body: string
  attachments: IOnUploadPayload[]
  status: string // Scheduled draft success
  created_at: string
  updated_at: string
}

export interface IOnUploadPayload {
  base64?: string
  file: File | null
  id: string
  progress: number
  uploadedFile?: IFile | null
}

export interface IPrompt {
  _id?: string
  title: string
  type: string
  tags: string[]
  created_at: string
  updated_at: string
}
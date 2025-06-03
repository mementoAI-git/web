export interface IFile {
  url: string;
  name: string;
  size: string | number
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

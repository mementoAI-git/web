import type { IAuth, IUser } from "@/utility/interface";

export const mockAuth: IAuth = {
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_at: new Date(Date.now() + 3600000).toISOString(),
  refresh_expires_at: new Date(Date.now() + 86400000).toISOString(),
};

export const mockUser: IUser = {
  _id: "user-123",
  email: "test@example.com",
  first_name: "Test",
  last_name: "User",
  nickname: "Tester",
  gender: "other",
  phone_number: "+1234567890",
  dob: "1990-01-01",
  country: "US",
  password: "",
  onboarded: true,
  onboarding_status: "completed",
  providers: ["email"],
  preferences: {
    communication_style: "casual",
    topics_of_interest: [],
    conversation_tone: "calm",
    response_length: "medium",
  },
  context: {
    self_description: "A test user",
    current_priority: "Testing",
    join_reasons: ["testing"],
  },
  verified: true,
  private_key: "",
  public_key: "",
  two_factor: { secret: "", enabled: false },
  picture: "",
  last_seen: new Date().toISOString(),
  streak: 5,
} as IUser;

export function createMockAuth(overrides?: Partial<IAuth>): IAuth {
  return { ...mockAuth, ...overrides };
}

export function createMockUser(overrides?: Partial<IUser>): IUser {
  return { ...mockUser, ...overrides };
}

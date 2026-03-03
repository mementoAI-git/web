export default {
  // auth
  login: "/auth/login",
  register: "/auth/register",
  sendLink: "/auth/send-link",
  resendLink: "/auth/resend-link",
  verifyEmail: "/auth/verify-email",
  refreshToken: "/auth/refresh-token",
  logout: "/auth/logout",
  oauth: "/auth/oauth/",
  setPassword: "/auth/set-password",

  // user
  profile: "/users/profile",
  userContext: "/users/context",
  completeOnboarding: "/users/complete-onboarding",
  uploadPicture: "/users/upload-picture",
  changePassword: "/users/change-password",
  setup2FA: "/users/2fa/setup",
  verifyTOTP: "/users/2fa/verify",
  disable2FA: "/users/2fa/disable",
  deleteAccount: "/users/account",
  userStats: "/users/stats",

  // beneficiaries
  beneficiaries: "/beneficiaries",
  beneficiary: "/beneficiaries/:id",
  resendInvite: "/beneficiaries/invite/resend",
  getInvite: "/beneficiaries/invite/",
  acceptInvite: "/beneficiaries/invite/accept",

  // groups
  groups: "/groups",
  group: "/groups/:id",
  groupMembers: "/groups/:id/members",
  groupMember: "/groups/:id/members/:beneficiaryId",

  // files
  upload: "/files/upload",
  files: "/files",

  // prompts
  prompts: "/prompts",
  suggestions: "/prompts/suggestions",
  replyPrompt: "/prompts/reply",
  promptDetails: "/prompts/",
  promptCategories: "/prompts/categories/",
  overviewPrompt: "/prompts/suggestions/overview",

  // memories
  memories: "/memories",
  memory: "/memories/:id",
  bookmarkMemory: "/memories/:id/bookmark",
  conversations: "/memories/conversations",
  stories: "/memories/stories",
  memoryPrompt: "/memories/prompt",
  restoreMemory: "/memories/:id/restore",
  memoriesStats: "/memories/stats",
  removeFileFromMemory: "/memories/remove-file",
  addMessageToMemory: "/memories/add-message",

  // ai
  aiPrompt: "/ai/prompt",
  aiGreet: "/ai/prompt/greet",
  aiPromptMessage: "/ai/prompt/messages",
  transcription: "/ai/transcribe-audio",
  startConversation: "/ai/conversation/new",
  ephemeralToken: "/ai/ephemeral-token",

  // capsule
  capsule: "/capsule",
  capsuleDelete: "/capsule/:id",
  capsuleStats: "/capsule/stats",

  // activities
  activities: "/activities",

  // feedback
  feedback: "/feedback",

  // sentry
  tunnel: `${import.meta.env.VITE_API_BASE_URL}/sentry_tunnel`,
};

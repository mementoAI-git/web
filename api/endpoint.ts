export default {
  // auth
  login: "/auth/login",
  register: "/auth/register",
  sendLink: "/auth/send-link",
  resendLink: "/auth/resend-link",
  verifyEmail: "/auth/verify-email",
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

  // beneficiaries
  beneficiaries: "/beneficiaries",
  resendInvite: "/beneficiaries/invite/resend",
  getInvite: "/beneficiaries/invite/",
  acceptInvite: "/beneficiaries/invite/accept",

  // files
  upload: "/files/upload",
  files: "/files",

  // prompts
  prompts: "/prompts",
  suggestions: "/prompts/suggestions",
  replyPrompt: "/prompts/reply",
  promptDetails: "/prompts/", // /prompts + id
  promptCategories: "/prompts/categories/", // /prompts + id

  // memories
  memories: "/memories",
  conversations: "/memories/conversations",
  stories: "/memories/stories",
  memoryPrompt: "/memories/prompt",
  memoriesStats: "/memories/stats",
  removeFileFromMemory: "/memories/remove-file",
  addMessageToMemory: "/memories/add-message",

  // ai
  aiPrompt: "/ai/prompt",
  aiGreet: "/ai/prompt/greet",
  aiPromptMessage: "/ai/prompt/messages",
  transcription: "/ai/transcribe-audio",
  startConversation: "/ai/conversation/new",

  // capsule
  capsule: "/capsule",

  // activities
  activities: "/activities"
};

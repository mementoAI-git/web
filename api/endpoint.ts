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
  updateStreak: "/users/update-streak",
  uploadPicture: "/users/upload-picture",
  changePassword: "/users/change-password",
  setup2FA: "/users/2fa/setup",
  verifyTOTP: "/users/2fa/verify",
  disable2FA: "/users/2fa/disable",

  // beneficiaries
  beneficiaries: "/beneficiaries",

  // files
  upload: "/files/upload",
  files: "/files",

  // prompts
  prompts: "/prompts",
  replyPrompt: "/prompts/reply",

  // memories
  memories: "/memories",

  // ai
  aiPrompt: "/ai/prompt",
  aiPromptMessage: "/ai/prompt/messages"
};

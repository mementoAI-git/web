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
  verify2FALogin: "/auth/2fa/verify",
  passkeyRegisterBegin: "/auth/passkey/register/begin",
  passkeyRegisterComplete: "/auth/passkey/register/complete",
  passkeyLoginBegin: "/auth/passkey/login/begin",
  passkeyLoginComplete: "/auth/passkey/login/complete",

  // user
  profile: "/users/profile",
  listPasskeys: "/users/passkeys",
  deletePasskey: "/users/passkeys/:credential_id",
  userContext: "/users/context",
  persona: "/users/persona",
  /** AI-written Memory Insights summary (persona + memories + session + pending insights) */
  personaMemoryInsightsSummary: "/users/persona/memory-insights-summary",
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
  groupsSearch: "/groups/search",
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
  publicMemory: "/memories/public",
  memoriesQuickCapture: "/memories/quick-capture",
  memory: "/memories/:id",
  bookmarkMemory: "/memories/:id/bookmark",
  conversations: "/memories/conversations",
  stories: "/memories/stories",
  memoryPrompt: "/memories/prompt",
  restoreMemory: "/memories/:id/restore",
  memoriesStats: "/memories/stats",
  removeFileFromMemory: "/memories/remove-file",
  addMessageToMemory: "/memories/add-message",
  conversationEnrichment: "/memories/:id/enrichment",

  // ai
  aiPrompt: "/ai/prompt",
  aiVoices: "/ai/voices",
  aiVoicePreview: "/ai/voice-preview",
  aiGreet: "/ai/prompt/greet",
  aiPromptMessage: "/ai/prompt/messages",
  transcription: "/ai/transcribe-audio",
  startConversation: "/ai/conversation/new",
  ephemeralToken: "/ai/ephemeral-token",
  generateTags: "/ai/generate-tags",
  generateStoryTitle: "/ai/generate-story-title",
  aiTasksRun: "/ai/tasks/run",
  aiMetricsOverview: "/ai/metrics/overview",
  aiMetricsTimeseries: "/ai/metrics/timeseries",
  aiPromptGovernanceStatus: "/ai/prompt-governance/status",

  // capsule
  capsule: "/capsule",
  capsuleDelete: "/capsule/:id",
  capsuleStats: "/capsule/stats",

  // activities
  activities: "/activities",

  // feedback
  feedback: "/feedback",

  // onboarding (Groot) — under users module
  onboardingDetails: "/users/onboarding-details",
  onboarding: "/users/onboarding",
  onboardingSkip: "/users/onboarding/skip",
  /** Host onboarding chat — streams like `/ai/prompt`; trailer JSON for chips / completion */
  hostOnboardingChatPrompt: "/users/onboarding/chat/prompt",

  // billing (Polar)
  billingSubscription: "/billing/subscription",
  billingCheckout: "/billing/checkout",
  billingPortal: "/billing/portal",
  billingCancel: "/billing/cancel",
  billingResume: "/billing/resume",
  billingPromoRedeem: "/billing/promo/redeem",
  billingInvoices: "/billing/invoices",

  // sentry
  tunnel: `${import.meta.env.VITE_API_BASE_URL}/sentry_tunnel`,

  // feature flags
  featureFlags: "/feature-flags",
  featureFlag: "/feature-flags/:key",
  featureFlagEvaluate: "/feature-flags/evaluate/:key",
};

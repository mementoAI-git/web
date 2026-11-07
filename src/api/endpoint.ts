export default {
  // auth
  login: "/auth/login",
  register: "/auth/register",
  sendRecoveryCode: "/auth/recovery/send-code",
  verifyRecoveryCode: "/auth/recovery/verify-code",
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
  referrals: "/users/referrals",
  shareProfile: "/users/profile/share",
  profile: "/users/profile",
  listPasskeys: "/users/passkeys",
  deletePasskey: "/users/passkeys/:credential_id",
  userContext: "/users/context",
  persona: "/users/persona",
  /** Saved and unreviewed observations as one list */
  personaObservations: "/persona/observations",
  personaObservation: "/persona/observations/:observationId",
  /** AI-written Memory Insights summary (persona + memories + session + pending insights) */
  personaMemoryInsightsSummary: "/users/persona/memory-insights-summary",
  /** Current rotating batch of insights */
  insights: "/users/insights",
  /** Memories behind an insight (?insight=) or enrichment field (?category=) */
  insightSources: "/users/insights/sources",
  completeOnboarding: "/users/complete-onboarding",
  uploadPicture: "/users/upload-picture",
  profileBanner: "/users/banner",
  profileBannerPosition: "/users/banner-position",
  uploadBanner: "/users/upload-banner",
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

  // media
  backgroundMusic: "/media/background-music",

  // files
  upload: "/files/upload",
  files: "/files",

  // prompts
  prompts: "/prompts",
  suggestions: "/prompts/suggestions",
  replyPrompt: "/prompts/reply",
  promptDetails: "/prompts/",
  promptCategories: "/prompts/categories/",
  exploreCategories: "/prompts/categories",
  overviewPrompt: "/prompts/suggestions/overview",

  // memories
  memories: "/memories",
  memorySearch: "/memories/search",
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
  spokenReply: "/ai/spoken-reply",
  aiGreet: "/ai/prompt/greet",
  aiPromptMessage: "/ai/prompt/messages",
  transcription: "/ai/transcribe-audio",
  startConversation: "/ai/conversation/new",
  ephemeralToken: "/ai/ephemeral-token",
  /** POST /ai/voice/tools/:name runs a server-side voice tool. */
  voiceTools: "/ai/voice/tools",
  chatActions: "/ai/chat/actions",
  voiceMemorySearch: "/ai/voice/memory-search",
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
  capsuleViewExchange: "/capsule/view/exchange",
  capsuleView: "/capsule/view",

  // activities
  activities: "/activities",

  // feedback
  feedback: "/feedback",

  // onboarding (Groot) — under users module
  onboardingDetails: "/users/onboarding-details",
  onboarding: "/users/onboarding",
  onboardingSkip: "/users/onboarding/skip",

  // billing (Polar)
  billingAccount: "/billing/account",
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

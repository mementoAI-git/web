# Feature Flag Inventory

Canonical feature-flag registry for Memento (web + API). Keys are dot-notated and grouped by domain.

## Auth
- `auth.login`
- `auth.signup`
- `auth.oauth`
- `auth.passkeys`
- `auth.two_factor`
- `auth.invite_accept`

## Onboarding
- `onboarding.legacy`
- `onboarding.groot`
- `onboarding.chat`
- `onboarding.nudges`

## Memory
- `memory.create`
- `memory.edit`
- `memory.delete`
- `memory.bookmark`
- `memory.share`
- `memory.search`
- `memory.insights`
- `memory.drafts`
- `memory.slash_commands`
- `memory.link_input`

## Attachments
- `attachments.image_upload`
- `attachments.video_upload`
- `attachments.audio_upload`
- `attachments.doc_upload`
- `attachments.paste_upload`
- `attachments.audio_record`
- `attachments.video_record`

## Prompts
- `prompts.daily`
- `prompts.reply`
- `prompts.suggestions`
- `prompts.category_explore`

## Chat
- `chat.host`
- `chat.conversation_stream`
- `chat.voice_mode`
- `chat.export_markdown`
- `chat.memory_chat`
- `chat.reply_flow`

## Capsule
- `capsule.create`
- `capsule.edit`
- `capsule.delete`
- `capsule.pause`
- `capsule.unpause`
- `capsule.reveal_pipeline`
- `capsule.scheduling_window`
- `capsule.attachment_support`

## Beneficiary
- `beneficiary.create`
- `beneficiary.update`
- `beneficiary.delete`
- `beneficiary.resend_invite`
- `beneficiary.accept_invite`

## Group
- `group.create`
- `group.update`
- `group.delete`
- `group.add_member`
- `group.remove_member`
- `group.search`

## Settings
- `settings.general`
- `settings.stats`
- `settings.security`
- `settings.privacy`
- `settings.billing_tab`

## Billing
- `billing.pricing_page`
- `billing.checkout`
- `billing.portal`
- `billing.subscription_summary`
- `billing.usage_limits`

## Feedback
- `feedback.submit`
- `feedback.screenshot_attach`
- `feedback.discord_notify`

## AI
- `ai.generate_tags`
- `ai.transcribe_audio`
- `ai.live_ephemeral_token`
- `ai.voices`
- `ai.voice_preview`
- `ai.governance_metrics`

## Dev
- `dev.ai_health_route`
- `dev.admin_tools`

## Admin
- `admin.feature_flags_dashboard`

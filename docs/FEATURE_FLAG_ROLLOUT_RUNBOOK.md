# Feature Flag Rollout Runbook

## Defaults
- Seed all keys from `FEATURE_FLAG_INVENTORY.md` with `default=true`.
- Start with no overrides in production.

## Rollout Order
1. Read-only/low-risk flags (`prompts.*`, `memory.search`, `settings.*`).
2. Medium-risk write flows (`beneficiary.*`, `group.*`, `memory.create`).
3. High-risk flows (`attachments.video_upload`, `chat.voice_mode`, `capsule.reveal_pipeline`).

## Kill Switch Procedure
1. Open `/admin/feature-flags`.
2. Toggle the target key off globally (`scope=global`, `scopeId=global`).
3. Confirm audit event is recorded.
4. Verify blocked requests return `402` with `feature` key.
5. Post incident update with key + timestamp + actor.

## Rollback Procedure
1. Re-enable the key at global scope.
2. Remove emergency override if feature should inherit default.
3. Validate API + frontend behavior in staging-like account.
4. Monitor logs for `"Feature gate blocked request"` drop to baseline.

## Safety Checklist
- Require reason for bulk or destructive changes.
- Prefer scoped override over global shutdown when possible.
- Use percentage rollout for uncertain releases.
- Keep admin allowlist (`FEATURE_FLAGS_ADMIN_EMAILS`, `VITE_FEATURE_FLAGS_ADMIN_EMAILS`) up to date.

## Verification Checklist
- `GET /feature-flags` returns expected effective values.
- `GET /feature-flags/:key/audit` includes the recent operation.
- Core user journey still works when no overrides exist.
- Feature-specific journey is blocked when corresponding key is disabled.

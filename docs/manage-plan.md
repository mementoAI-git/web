# Manage plan

The Pro banner opens the shared pricing overlay inside settings. Web presents Free and Pro cards with a Monthly/Annual switcher above them. The switcher initially follows the current billing interval and changes the Pro price and action. The actual `billing_interval` marks a disabled Current plan button; it is not inferred from Pro entitlement. Accounts with promo-only Pro access are identified separately.

New subscribers enter checkout for their selected interval. Existing recurring subscribers use Polar’s customer portal to change their billing period, preventing a second subscription. Monthly and annual Pro have the same features; annual is presented as the upgrade/savings choice, and annual members can switch to monthly. Legacy members are not offered a lower Pro purchase.

Downgrade to free and Cancel plan share confirmation and cancellation-feedback steps. Cancellation is scheduled at period end with Polar before local state is saved. Failed provider requests preserve feedback and do not mark cancellation successful. Scheduled cancellation exposes Keep plan, which clears the provider cancellation flag. No recurring subscription means no cancellation action.

API subscription summaries now expose `billing_interval` and `can_manage_subscription`. Polar subscription webhooks synchronize billing intervals. POST `/billing/cancel` accepts optional validated `reason` and `comment` feedback; POST `/billing/resume` retains its existing contract. All writes are scoped to the authenticated user's provider subscription. Polar access tokens need subscription write permissions. Both API and frontend updates need deployment.

Billing details, payment-method editing, and recent-invoice improvements remain the next requested phase. Verification uses mocked provider requests; no live subscriptions are cancelled or charged by tests.

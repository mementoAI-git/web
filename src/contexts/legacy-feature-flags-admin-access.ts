/** Legacy component fixtures only. Not imported by the customer application.
 * Server management endpoints now require an independent staff session.
 */
export const isFeatureFlagAdminUser = (email?: string | null) => {
  const emails =
    (import.meta.env.VITE_FEATURE_FLAGS_ADMIN_EMAILS as string | undefined)
      ?.split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean) || [];
  return Boolean(email && emails.includes(email.toLowerCase()));
};

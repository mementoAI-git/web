import {
  normalizeSocialProfileUrl,
  type SocialAccounts,
} from "./social-accounts";

import { socialPlatforms } from "./social-platforms";

export function SocialProfileLinks({
  accounts,
}: {
  accounts?: SocialAccounts;
}) {
  return socialPlatforms.map(({ key, label, Icon }) => {
    const account = accounts?.[key];
    const url =
      account && ["user", "ai"].includes(account.source)
        ? normalizeSocialProfileUrl(key, account.url)
        : null;
    return url ? (
      <a
        key={key}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${label} profile`}
        title={label}
        className="flex size-8 items-center justify-center rounded-md text-icon-neutral-weak hover:text-icon-neutral-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-neutral-strong"
      >
        <Icon className="size-6" aria-hidden />
      </a>
    ) : null;
  });
}

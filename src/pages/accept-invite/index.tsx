import { Button } from "@/components/ui/button";
import { useRequestRecovery } from "@/hooks/use-request-recovery";
import { isUnavailablePublicLink } from "@/lib/public-link-status";
import endpoint from "@/api/endpoint";
import { Link, useParams } from "react-router-dom";
import useSWR from "swr";
import type { IBeneficiary } from "@/utility/interface";
import { AuthLoader } from "@/components/auth-loader";
import { OnboardingCard } from "@/pages/onboarding/components/onboarding-card";
import { TimesIcon } from "@/components/icons";
import { AuthFormPanel } from "@/pages/auth/components/layout";
import AcceptInviteForm from "./components/form";

export default function AcceptInvitePage() {
  const { id = "" } = useParams();
  const { data, error, isLoading, mutate } = useSWR(
    id ? `${endpoint.getInvite}${id}` : null,
    { shouldRetryOnError: false },
  );
  const temporaryError = error && !isUnavailablePublicLink(error);
  const retry = useRequestRecovery(
    `invite:${id}`,
    temporaryError,
    mutate,
    "Your invitation couldn’t be loaded. Try again.",
  );
  const inviteData = isUnavailablePublicLink(error)
    ? undefined
    : (data?.data as IBeneficiary | undefined);

  return (
    <div className="onboarding-layout flex min-h-dvh w-full flex-col bg-bg-neutral font-geist text-text-neutral-strong">
      <header className="flex h-20 shrink-0 items-center justify-center border-b border-stroke-neutral-weak px-5 py-5 sm:px-10">
        <Link
          to="/"
          className="font-garamond text-[32px] font-medium leading-10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stroke-brand-strong"
        >
          Memento.
        </Link>
      </header>
      <main className="flex w-full flex-1 items-center justify-center px-4 py-8 sm:px-10 sm:py-12">
        <OnboardingCard className="my-auto">
          {isLoading ? (
            <AuthLoader embedded title="Loading your invite…" />
          ) : temporaryError && !inviteData ? (
            <div className="flex justify-center">
              <Button variant="outline" onClick={retry}>
                Retry loading invitation
              </Button>
            </div>
          ) : inviteData ? (
            <AcceptInviteForm data={inviteData} />
          ) : (
            <AuthFormPanel
              title="This invitation isn’t available"
              className="error"
              icon={<TimesIcon width={33.33} />}
              subtitle="It may have expired or already been accepted. Ask the sender for a new invitation."
              footer={
                <Link to="/login" className="text-text-brand-strong underline">
                  Sign in to Memento
                </Link>
              }
            />
          )}
        </OnboardingCard>
      </main>
    </div>
  );
}

import endpoint from "@/api/endpoint";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import type { IBeneficiary } from "@/utility/interface";
import { AuthLoader } from "@/components/auth-loader";
import { AuthSplitShell } from "@/components/auth-split-layout";
import { TimesIcon } from "@/components/icons";
import { AuthFormPanel } from "@/pages/auth/components/layout";
import AcceptInviteForm from "./components/form";

export default function AcceptInvitePage() {
  const { id = "" } = useParams();
  const { data, error, isLoading } = useSWR(id ? `${endpoint.getInvite}${id}` : null);
  const inviteData = data?.data as IBeneficiary | undefined;

  return (
    <AuthSplitShell>
      {isLoading ?
        <AuthLoader embedded title="Loading your invite…" />
      : error ?
        <AuthFormPanel
          title="Something went wrong"
          className="error"
          icon={<TimesIcon width={33.33} />}
          subtitle={
            error?.message ??
            "We couldn’t find your invite. Please check your invite link or contact support."
          }
        />
      : inviteData ?
        <AcceptInviteForm data={inviteData} />
      : <AuthFormPanel
          title="Something went wrong"
          className="error"
          icon={<TimesIcon width={33.33} />}
          subtitle="We couldn’t find your invite. Please check your invite link or contact support."
        />
      }
    </AuthSplitShell>
  );
}

import endpoint from "@/api/endpoint";
import bg5 from "@/assets/image/bg/5.png";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import type { IBeneficiary } from "@/utility/interface";
import { AuthLoader } from "@/components/auth-loader";
import Logo from "@/components/logo";
import AuthLayout from "../auth/components/layout";
import { TimesIcon } from "@/components/icons";
import AcceptInviteForm from "./components/form";

export default function AcceptInvitePage() {
  const { id = "" } = useParams();
  const { data, error, isLoading } = useSWR(id ? `${endpoint.getInvite}${id}` : null);
  const inviteData = data?.data as IBeneficiary | undefined;

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center overflow-auto">
      <img
        src={bg5}
        alt="Cloudy background"
        className="pointer-events-none absolute inset-0 size-full object-cover"
      />
      <div className="z-10 flex w-full max-w-full flex-col items-center gap-10 px-4 sm:max-w-[583px] sm:px-0">
        <Logo />
        {
          isLoading ?
            <AuthLoader title="Loading..." /> :
            error ?
              <AuthLayout
                title="Something went wrong"
                className="error rounded-3xl!"
                icon={<TimesIcon width={33.33} />}
                subtitle={
                  error?.message ??
                  "We couldn’t find your invite. Please check your invite link or contact support."
                }
              /> :
              inviteData ?
                <AcceptInviteForm data={inviteData} /> :
                <AuthLayout
                  title="Something went wrong"
                  className="error rounded-3xl!"
                  icon={<TimesIcon width={33.33} />}
                  subtitle="We couldn’t find your invite. Please check your invite link or contact support."
                />
        }
      </div>
    </div>
  );
}


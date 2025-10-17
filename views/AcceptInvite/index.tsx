"use client"

import endpoint from "@/api/endpoint"
import { LogoV2 } from "@/components/Logo"
import useSWR from "swr"
import { AuthLoader } from "../Auth"
import { AuthFormLayout } from "../Auth";
import TimesIcon from "@/public/icon/times.svg";
import AcceptInviteForm from "./Form"

export default function AcceptInvite({ invite_id }) {
  const { data, error, isLoading } = useSWR(`${endpoint.getInvite}${invite_id}`)

  return (
    <div className="flex flex-col items-center gap-10 sm:gap-16 w-full max-w-full sm:max-w-[583px] px-4 sm:px-0 z-50">
      <LogoV2 />
      {
        isLoading ?
          <AuthLoader title="Loading..." /> :
          error ?
            <AuthFormLayout
              title="Something went wrong"
              className="error !rounded-3xl"
              icon={<TimesIcon width={33.33} />}
              subtitle={
                error?.message ||
                'We couldn’t find your invite. Please check your invite link or contact support.'
              }
            /> :
            <AcceptInviteForm data={data?.data} />
      }
    </div>
  )
}
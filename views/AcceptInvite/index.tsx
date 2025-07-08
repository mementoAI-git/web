"use client"

import endpoint from "@/api/endpoint"
import Logo from "@/components/Logo"
import useSWR from "swr"
import { AuthLoader } from "../Auth"
import { AuthFormLayout } from "../Auth";
import TimesIcon from "@/public/icon/times.svg";
import AcceptInviteForm from "./Form"
import { isEmpty } from "@/utility"
import AcceptInviteButtons from "./Butttons"

export default function AcceptInvite({ invite_id }) {
  const { data, error, isLoading } = useSWR(`${endpoint.getInvite}${invite_id}`)

  return (
    <div className="flex flex-col items-center gap-16 w-full max-w-[583px] z-50">
      <Logo color="light" size={50} textClassName="text-9.5" />
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
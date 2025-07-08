import bg from "@/public/image/accept-invite-bg.png"
import AcceptInvite from "@/views/AcceptInvite"
import Image from "next/image"
import { use } from "react";

export default function AcceptInvitePage({ params }) {
  const { id } = use(params) as { id: string };
  return (
    <div className="min-h-screen bg-[rgba(29,56,190,1)] w-screen flex items-center justify-center relative">
      <Image className="w-full h-full absolute top-0 bottom-0 right-0 left-0" src={bg} alt="" />
      <AcceptInvite invite_id={id} />
    </div>
  )
}
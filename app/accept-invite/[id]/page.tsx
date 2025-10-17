
import AcceptInvite from "@/views/AcceptInvite"
import Image from "next/image"
import { use } from "react";
import bg5 from "@/public/image/bg/5.png"

export default function AcceptInvitePage({ params }) {
  const { id } = use(params) as { id: string };
  return (
    <div className="min-h-screen overflow-auto hide-scrollbar w-screen flex items-center justify-center relative">
      <Image src={bg5} alt="Cloudy BG" className="absolute top-0 bottom-0 left-0 right-0 mx-auto " />
      <AcceptInvite invite_id={id} />
    </div>
  )
}
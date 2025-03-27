'use client'

import { Button } from "@/components/Buttons";
import { Textinput } from "@/components/Form";
import { useRouter } from "next/navigation";

export function ForgetPassword() {
  const router = useRouter()
  return (
    <form className="flex flex-col gap-6">
      <Textinput label="Email" name="email" placeholder="johndoe@mail.com" />
      <Button
        title="Submit"
        type="button"
        onClick={() => router.push('/check-mail')}
        className="mt-3"
      />
    </form>
  )
}
import { Button } from "@/components/Buttons";
import { Passwordinput, Textinput } from "@/components/Form";
import Link from "next/link";

export function Login() {
  return (
    <form className="flex flex-col gap-6">
      <Textinput label="Email" name="email" placeholder="johndoe@mail.com" />
      <Passwordinput label="Password" name="password" />

      <div className="flex items-center justify-between text-sm font-inter">
        <div className="flex items-center gap-2">
          <div className="w-4 aspect-square rounded-sm border cursor-pointer border-[#D0D5DD]" />
          <span>Remember for 30 days</span>
        </div>
        <Link href="/forget-password" className="text-primary font-bold cursor-pointer">Reset password</Link>
      </div>
      <Button title="Login" className="mt-3" />
    </form>
  )
}
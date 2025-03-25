import { Button } from "@/components/Buttons";
import { Passwordinput, Textinput } from "@/components/Form";

export function Login() {
  return (
    <form className="flex flex-col gap-6">
      <Textinput label="Email" name="email" placeholder="johndoe@mail.com" />
      <Passwordinput label="Password" name="password" />

      <div className="flex items-center justify-between text-sm font-inter">
        <div className="flex items-center gap-2">
          <div className="w-4 aspect-square rounded-sm border border-[#D0D5DD]" />
          <span>Remember for 30 days</span>
        </div>
        <span className="text-primary font-bold">Reset password</span>
      </div>
      <Button title="Login" />
    </form>
  )
}
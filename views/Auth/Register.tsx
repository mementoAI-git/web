import { Button } from "@/components/Buttons"
import { Passwordinput, Textinput } from "@/components/Form"

export function Register() {
  return (
    <form className="flex flex-col gap-6">
      <Textinput label="Email" name="email" placeholder="johndoe@mail.com" />
      <Passwordinput label="Password" name="password" />
      <Button title="Create account" />

      <small className="font-inter text-sm leading-5 text-center text-grey-200">
        By clicking “Create account” you agree to the
        <span className="text-primary underline">Terms of Use</span> and
        <span className="text-primary underline"> Privacy Policy</span>
      </small>
    </form>
  )
}
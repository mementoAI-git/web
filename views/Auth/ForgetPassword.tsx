import { Button } from "@/components/Buttons";
import { Textinput } from "@/components/Form";

export function ForgetPassword() {
  return (
    <form className="flex flex-col gap-6">
      <Textinput label="Email" name="email" placeholder="johndoe@mail.com" />
      <Button title="Submit" className="mt-3" />
    </form>
  )
}
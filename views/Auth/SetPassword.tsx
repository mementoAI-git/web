import { Button } from "@/components/Buttons";
import { Passwordinput } from "@/components/Form";

const stength_colors = [
  "rgba(199, 58, 58, 0.8)",
  "rgba(199, 58, 58, 0.8)",
  "rgba(143, 108, 26, 0.8)",
  "rgba(143, 108, 26, 0.8)",
  "rgba(6, 122, 87, 0.8)",
  "rgba(6, 122, 87, 0.8)"
]

function StrengthIndicator({ level = 0 }) {
  return (
    <div>
      <span className="font-geist leading-[150%] text-grey-200 text-sm">Password strength</span>
      <div className="flex gap-1 items-center">
        {
          stength_colors
            .map(color => <div className="max-w-[73px] flex-1 h-[12px] rounded-3xl" style={{ backgroundColor: color }} />)
            .slice(0, Math.min(stength_colors.length, level))
        }
      </div>
    </div>
  )
}

export function SetPassword() {
  return (
    <form className="flex flex-col gap-6">
      <Passwordinput label="Password" name="password" />
      <Passwordinput label="Confirm Password" name="confirm_password" />
      <StrengthIndicator level={4} />
      <Button title="Set new password" className="mt-3" />
    </form>
  )
}
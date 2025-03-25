import { AuthFormLayout, SetPassword } from "@/views/Auth";
import LockIcon from "@/public/icon/lock.svg"

export default function SetPasswordPage() {
  return (
    <AuthFormLayout
      title="Set new password"
      can_go_back
      icon={<LockIcon />}
      subtitle="Your new password must be different from previously used passwords on this platform. "
    >
      <SetPassword />
    </AuthFormLayout>
  )
}
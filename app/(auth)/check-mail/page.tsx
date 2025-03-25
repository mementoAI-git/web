import { Button } from "@/components/Buttons";
import { AuthFormLayout } from "@/views/Auth";
import LockIcon from "@/public/icon/lock.svg"

export default function CheckMailPage() {
  return (
    <AuthFormLayout
      title="Check your inbox"
      can_go_back
      icon={<LockIcon />}
      subtitle="We’ve sent an email containing the password reset instructions to wis***@gmail.com. Please check your inbox or spam folders."
    >
      <Button title="Open Mailbox" />
    </AuthFormLayout>
  )
}
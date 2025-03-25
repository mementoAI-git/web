import { Button } from "@/components/Buttons";
import { AuthFormLayout } from "@/views/Auth";
import LockIcon from "@/public/icon/lock.svg"

export default function VerifykMailPage() {
  return (
    <AuthFormLayout
      title="Verify your email"
      can_go_back
      icon={<LockIcon />}
      subtitle="We’ve sent verification instructions to wis***@gmail.com. Please check your inbox or spam folders."
    >
      <Button title="Open Mailbox" />
    </AuthFormLayout>
  )
}
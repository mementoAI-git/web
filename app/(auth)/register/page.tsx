import { AuthFormLayout, Register } from "@/views/Auth";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <AuthFormLayout
      title="Create account"
      subtitle={
        <span>Already have an account?
          <Link href="/login" className="text-primary font-bold"> Sign in</Link>
        </span>
      }
      include_auth_socials
    >
      <Register />
    </AuthFormLayout>

  )
}
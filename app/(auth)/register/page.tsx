import { AuthFormLayout, Register } from "@/views/Auth";

export default function RegisterPage() {
  return (
    <AuthFormLayout
      title="Create account"
      subtitle={
        <span>Already have an account?
          <span className="text-primary font-bold"> Sign in</span>
        </span>
      }
      include_auth_socials
    >
      <Register />
    </AuthFormLayout>

  )
}
import { AuthFormLayout, Login } from "@/views/Auth";

export default function LoginPage() {
  return (
    <AuthFormLayout
      title="Welcome back"
      subtitle={
        <span>New here?
          <span className="text-primary font-bold"> Create an account</span>
        </span>
      }
      include_auth_socials
    >
      <Login />
    </AuthFormLayout>
  )
}
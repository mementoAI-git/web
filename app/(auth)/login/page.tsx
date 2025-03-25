import { AuthFormLayout, Login } from "@/views/Auth";
import Link from "next/link";

export default function LoginPage() {
  return (
    <AuthFormLayout
      title="Welcome back"
      subtitle={
        <span>New here?
          <Link href="/register" className="text-primary font-bold"> Create an account</Link>
        </span>
      }
      include_auth_socials
    >
      <Login />
    </AuthFormLayout>
  )
}
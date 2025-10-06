import { AuthFormLayout, Login } from "@/views/Auth";
import Link from "next/link";

export default function LoginPage() {
  return (
    <AuthFormLayout
      title="Login to continue"
      subtitle="Welcome back. Login to access your account"
      include_auth_socials
      footer={
        <span className="text-center text-gray-600 font-inter">
          New user?
          <Link href="/register" className="text-blue-6 font-bold font-inter text-sm underline"> Create an account</Link>
        </span>
      }
    >
      <Login />
    </AuthFormLayout>
  );
}

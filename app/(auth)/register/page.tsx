import { AuthFormLayout, Register } from "@/views/Auth";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <AuthFormLayout
      title="Create account"
      subtitle="Create a new account on Memento to start crafting your stories."
      include_auth_socials
      footer={
        <span className="text-center text-gray-600 font-inter">
          Already have an account?
          <Link href="/login" className="text-blue-6 font-bold font-inter text-sm underline"> Login</Link>
        </span>
      }
    >
      <Register />
    </AuthFormLayout>
  );
}

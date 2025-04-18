import { AuthFormLayout, ForgetPassword } from "@/views/Auth";

export default function ForgetPasswordPage() {
  return (
    <AuthFormLayout
      title="Forgot Password"
      can_go_back
      subtitle="Please enter your email address. We will send instructions to reset your password if this email exists in our system."
    >
      <ForgetPassword />
    </AuthFormLayout>
  );
}

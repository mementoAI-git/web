import React from "react";
import { SocialButton } from "@/components/Buttons"
import GoogleIcon from "@/public/icon/google.svg"
import AppleIcon from "@/public/icon/apple.svg"
import FacebookIcon from "@/public/icon/facebook.svg"
import { signIn } from "@/auth";

export default function AuthSocials() {
  return (
    <React.Fragment>
      <div className="flex flex-col gap-4 my-3">
        <SocialButton onClick={signIn("google")} icon={<GoogleIcon />} title="Sign up with Google" />
        <SocialButton onClick={signIn("facebook")} icon={<FacebookIcon />} title="Sign up with Facebook" />
        <SocialButton onClick={signIn("apple")} icon={<AppleIcon />} title="Sign up with Apple" />
      </div>

      <div className="flex justify-between items-center gap-6 mb-3">
        <div className="flex-1 border-t border-grey-100" />
        <span className="font-geist text-sm text-grey-200">Or sign in with</span>
        <div className="flex-1 border-t border-grey-100" />
      </div>
    </React.Fragment>
  )
}
"use client"

import React, { useState } from "react";
import { SocialButton } from "@/components/Buttons"
import GoogleIcon from "@/public/icon/google.svg"
import AppleIcon from "@/public/icon/apple.svg"
import FacebookIcon from "@/public/icon/facebook.svg"
import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";

const providers = [
  { title: "google", desc: "Sign up with Google", icon: <GoogleIcon /> },
  { title: "facebook", desc: "Sign up with Facebook", icon: <FacebookIcon /> },
  { title: "apple", desc: "Sign up with Facebook", icon: <AppleIcon /> },
]

export default function AuthSocials() {
  const [provider, setProvider] = useState("google")
  const { trigger, isMutating } = useFetcher(`${endpoint.oauth}${provider}`, "get")

  const handleBtnClick = async (provider: string) => {
    setProvider(provider)
    const result = await trigger()
    window.open(result?.data?.url, "_blank")
  }
  return (
    <React.Fragment>
      <div className="flex flex-col gap-4 my-3">
        {
          providers.map(p => (
            <SocialButton
              key={p.title}
              icon={p.icon}
              disabled={isMutating}
              onClick={() => handleBtnClick(p.title)}
              title={p.desc}
            />
          ))
        }
      </div>

      <div className="flex justify-between items-center gap-6 mb-3">
        <div className="flex-1 border-t border-grey-100" />
        <span className="font-geist text-sm text-grey-200">Or sign in with</span>
        <div className="flex-1 border-t border-grey-100" />
      </div>
    </React.Fragment>
  )
}
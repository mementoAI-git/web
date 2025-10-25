"use client";

import React, { useState } from "react";
import GoogleIcon from "@/public/icon/google.svg";
import AppleIcon from "@/public/icon/apple.svg";
import FacebookIcon from "@/public/icon/facebook.svg";
import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";

const providers = [
  { title: "google", desc: "Sign up with Google", icon: <GoogleIcon /> },
  { title: "facebook", desc: "Sign up with Facebook", icon: <FacebookIcon /> },
  { title: "apple", desc: "Sign up with Apple", icon: <AppleIcon /> },
];

export default function AuthSocials() {
  return (
    <React.Fragment>
      <div className=" flex items-center justify-between gap-6">
        <div className="flex-1 border-t border-grey-100" />
        <span className="font-geist text-sm text-grey-200">
          Or sign in with
        </span>
        <div className="flex-1 border-t border-grey-100" />
      </div>

      <div className="my-1 flex w-full gap-4">
        {providers.map((p, i) => {
          const { trigger, isMutating } = useFetcher(
            `${endpoint.oauth}${p.title}`,
            "get",
          );

          const handleBtnClick = async () => {
            const result = await trigger();
            window.open(result?.data?.url, "_blank");
          };
          return (
            <button
              key={i}
              onClick={handleBtnClick}
              disabled={isMutating}
              className="flex max-h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-grey-100 bg-white px-3 py-4 shadow-sm disabled:opacity-65 transition-all duration-150 hover:scale-[97%]"
            >
              {p.icon}
            </button>
          )
        })}
      </div>
    </React.Fragment>
  );
}

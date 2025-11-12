"use client";

import React from "react";
import type { ComponentType, SVGProps } from "react";
import endpoint from "@/api/endpoint";
import { GoogleIcon } from "@/components/icons";
import useFetcher from "@/hooks/use-fetcher";

const providers: Array<{
  title: string;
  desc: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}> = [
    { title: "google", desc: "Sign up with Google", icon: GoogleIcon },
    // Future providers can be added here
  ];

export default function AuthSocials() {
  return (
    <React.Fragment>
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1 border-t border-grey-100" />
        <span className="font-geist text-sm text-grey-200">Or sign in with</span>
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
            if (result?.data?.url) {
              window.open(result.data.url, "_blank");
            }
          };
          return (
            <button
              key={i}
              onClick={handleBtnClick}
              disabled={isMutating}
              className="flex max-h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-grey-100 bg-white px-3 py-4 shadow-sm transition-all duration-150 hover:scale-[97%] disabled:opacity-65"
            >
              <p.icon width={20} height={20} />
              {p.desc}
            </button>
          );
        })}
      </div>
    </React.Fragment>
  );
}


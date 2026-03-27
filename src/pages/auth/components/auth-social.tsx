"use client";

import type { ComponentType, SVGProps } from "react";
import endpoint from "@/api/endpoint";
import { GoogleIcon } from "@/components/icons";
import useFetcher from "@/hooks/use-fetcher";

interface Provider {
  title: string;
  desc: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const providers: Provider[] = [
  { title: "google", desc: "Continue with Google", icon: GoogleIcon },
  // Future providers: { title: "facebook", desc: "Continue with Facebook", icon: FacebookIcon },
];

/** Individual button — keeps hook call at the top-level of its own component */
function SocialButton({ title, desc, icon: Icon }: Provider) {
  const { trigger, isMutating } = useFetcher(
    `${endpoint.oauth}${title}`,
    "get",
  );

  const handleClick = async () => {
    const result = await trigger();
    if (result?.data?.url) {
      window.location.href = result.data.url;
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isMutating}
      className="flex max-h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-grey-100 bg-white px-3 py-4 shadow-sm transition-all duration-150 hover:scale-[97%] disabled:opacity-65"
    >
      <Icon width={20} height={20} />
      {desc}
    </button>
  );
}

export default function AuthSocials() {
  return (
    <>
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1 border-t border-grey-100" />
        <span className="font-geist text-sm text-grey-200">Or sign in with</span>
        <div className="flex-1 border-t border-grey-100" />
      </div>

      <div className="my-1 flex w-full gap-4">
        {providers.map((p) => (
          <SocialButton key={p.title} {...p} />
        ))}
      </div>
    </>
  );
}

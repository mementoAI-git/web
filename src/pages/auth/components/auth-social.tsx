"use client";

import type { ComponentType, SVGProps } from "react";
import endpoint from "@/api/endpoint";
import { GoogleIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import useFetcher from "@/hooks/use-fetcher";

interface Provider {
  title: string;
  desc: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const providers: Provider[] = [
  { title: "google", desc: "Continue with Google", icon: GoogleIcon },
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
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={isMutating}
      className="h-10 w-full gap-2.5 rounded-full border-v3-stroke-weak bg-v3-bg font-inter text-xs font-medium shadow-none sm:text-sm hover:bg-v3-fill-weaker"
    >
      <Icon width={20} height={20} />
      {desc}
    </Button>
  );
}

export default function AuthSocials({ showDivider = true }: { showDivider?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      {showDivider ?
        <div className="flex items-center justify-between gap-3">
          <div className="h-px flex-1 bg-v3-stroke-weak" />
          <span className="shrink-0 font-inter text-xs text-v3-text-weak sm:text-sm">Or</span>
          <div className="h-px flex-1 bg-v3-stroke-weak" />
        </div>
      : null}
      {providers.map((p) => (
        <SocialButton key={p.title} {...p} />
      ))}
    </div>
  );
}

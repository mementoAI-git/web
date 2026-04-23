"use client";

import { Link } from "react-router-dom";
import endpoint from "@/api/endpoint";
import { AuthCenteredSplitShell } from "@/components/auth-split-layout";
import useFetcher from "@/hooks/use-fetcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function SignupChoicePage() {
  const { trigger, isMutating } = useFetcher(`${endpoint.oauth}google`, "get");

  const handleGoogleSignup = async () => {
    const result = await trigger();
    if (result?.data?.url) {
      window.location.href = result.data.url;
    }
  };

  return (
    <AuthCenteredSplitShell>
      <div className="mb-6 flex flex-col gap-1.5 sm:mb-7 sm:gap-2">
        <h1 className="font-garamond text-[1.625rem] font-normal leading-snug text-v3-text-strong sm:text-[1.9rem] lg:text-[1.75rem] lg:leading-tight">
          Welcome
        </h1>
        <p className="font-inter text-xs leading-relaxed text-v3-text-weak sm:text-sm">
          Create your account to get started with Memento.
        </p>
      </div>

      <Card className="w-full rounded-none border-0 bg-transparent py-0 shadow-none ring-0">
        <CardContent className="w-full p-0">
          <div className="flex w-full flex-col gap-3">
            <Button
              type="button"
              onClick={handleGoogleSignup}
              disabled={isMutating}
              className="h-10 w-full rounded-[8px] bg-v3-brand-strong text-white hover:bg-v3-brand-strong/90"
            >
              Sign up with Google
            </Button>

            <Button asChild type="button" variant="outline" className="h-10 w-full rounded-[8px]">
              <Link to="/register">Use email and password</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 text-center sm:mt-5">
        <Link
          to="/login"
          className="font-inter text-xs text-v3-text-weak underline underline-offset-2 transition-colors hover:text-v3-text-strong"
        >
          I have an account
        </Link>
      </div>
    </AuthCenteredSplitShell>
  );
}

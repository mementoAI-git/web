import { Button } from "@/components/ui/button";
import { useRequestRecovery } from "@/hooks/use-request-recovery";
import { isUnavailablePublicLink } from "@/lib/public-link-status";
import useSWR from "swr";
import { Link, useParams } from "react-router-dom";
import Logo from "@/components/logo";
import endpoint from "@/api/endpoint";
import { useStore } from "@/hooks/use-store";
import { isEmpty } from "@/utility";
import Loading from "./loading";
import Post from "./post";
import type { IResponse } from "@/api/interface";
import type { IPublicMemory } from "@/utility/interface";

export function PostPage() {
  const { auth, hydrated } = useStore();
  const { id = "" } = useParams();
  const { data, error, isLoading, mutate } = useSWR<IResponse<IPublicMemory>>(
    id ? `${endpoint.publicMemory}/${id}` : null,
    { shouldRetryOnError: false },
  );
  const temporaryError = error && !isUnavailablePublicLink(error);
  const retry = useRequestRecovery(`public-story:${id}`, temporaryError, mutate, "This story couldn’t be loaded. Try again.");
  const memory = isUnavailablePublicLink(error) ? undefined : data?.data;

  return (
    <div className="min-h-screen w-screen bg-background">
      <header className="flex max-h-[96px] w-full max-w-[1440px] items-center justify-between border-b border-[#0011661A] px-4 py-4 sm:px-8 sm:py-6 lg:px-20">
        <Logo />
        {!hydrated ? (
          <div className="h-12 min-w-38 rounded-lg bg-gray-200" />
        ) : (
          isEmpty(auth?.access_token) && (
            <Button asChild><Link to="/register">Join Memento</Link></Button>
          )
        )}
      </header>
      <main className="mx-auto p-4 sm:p-8">
        <div className="mx-auto w-full max-w-235">
          {isLoading ? (
            <Loading />
          ) : memory ? (
            <Post memory={memory} />
          ) : temporaryError ? (
            <Button variant="outline" onClick={retry}>Retry loading story</Button>
          ) : (
            <div className="rounded-xl border border-stroke-neutral-weak bg-bg-neutral-solid p-8 text-center">
              <h1 className="font-garamond text-3xl text-text-neutral-strong">
                This memory isn’t available
              </h1>
              <p className="mt-2 font-inter text-sm text-text-neutral-weak">
                {error ? "The link may have expired or been removed." : "Check the link and try again."}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

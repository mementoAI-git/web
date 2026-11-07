import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useRequestRecovery } from "@/hooks/use-request-recovery";
import { isUnavailablePublicLink } from "@/lib/public-link-status";
import useSWR from "swr";
import { Link, useParams } from "react-router-dom";
import Logo from "@/components/logo";
import Modal from "@/components/modal";
import endpoint from "@/api/endpoint";
import { useStore } from "@/hooks/use-store";
import { isEmpty } from "@/utility";
import { StoryMobilePaper } from "@/components/modal/memory/story-reader";
import { useStoryMobileViewport } from "@/components/modal/memory/story-reader-utils";
import Loading from "./loading";
import Post from "./post";
import type { IResponse } from "@/api/interface";
import type { IPublicMemory } from "@/utility/interface";

export function PostPage() {
  const { auth, hydrated } = useStore();
  const isMobile = useStoryMobileViewport();
  const { id = "" } = useParams();
  const signedIn = hydrated && !isEmpty(auth?.access_token);
  const {
    data: publicData,
    error: publicError,
    isLoading: publicLoading,
    mutate: refreshPublic,
  } = useSWR<IResponse<IPublicMemory>>(
    id ? `${endpoint.publicMemory}/${id}` : null,
    { shouldRetryOnError: false },
  );
  const notPublic = isUnavailablePublicLink(publicError);
  // Private stories stay readable for their owner and the people they're shared with.
  const {
    data: privateData,
    error: privateError,
    isLoading: privateLoading,
    mutate: refreshPrivate,
  } = useSWR<IResponse<IPublicMemory>>(
    id && notPublic && signedIn ? `${endpoint.memories}/${id}` : null,
    { shouldRetryOnError: false },
  );

  const privateRetryable = privateError && !isUnavailablePublicLink(privateError);
  const temporaryError = privateRetryable || (publicError && !notPublic);
  const refresh = useCallback(
    (): Promise<unknown> => (privateRetryable ? refreshPrivate() : refreshPublic()),
    [privateRetryable, refreshPrivate, refreshPublic],
  );
  const retry = useRequestRecovery(
    `public-story:${id}`,
    temporaryError,
    refresh,
    "This story couldn’t be loaded. Try again.",
  );
  const memory = notPublic ? privateData?.data : publicData?.data;
  const loginPath = `/login?redirect=${encodeURIComponent(`/post/${id}`)}`;
  const loading = publicLoading || privateLoading || (notPublic && !hydrated);

  return (
    <div className="relative isolate flex h-dvh w-screen flex-col overflow-hidden bg-background lg:min-h-[640px] lg:overflow-visible">
      {isMobile ? <StoryMobilePaper /> : null}
      <header className="w-full shrink-0 border-b border-stroke-neutral-weaker">
        <div className="mx-auto flex w-full max-w-[758px] items-center justify-between px-4 py-3 lg:max-w-[1440px] lg:px-20">
          <Logo className="text-text-neutral-strong" />
          {!hydrated ? (
            <div className="h-10 min-w-38 rounded-lg bg-fill-neutral-weaker" />
          ) : signedIn ? (
            <Button asChild><Link to="/overview">Go to app</Link></Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="outline"><Link to={loginPath}>Log in</Link></Button>
              <Button asChild className="max-[359px]:hidden"><Link to="/register">Join Memento</Link></Button>
            </div>
          )}
        </div>
      </header>
      <main className="flex min-h-0 w-full flex-1 flex-col lg:p-6">
        {loading ? (
          <Loading />
        ) : memory ? (
          <div className="mx-auto min-h-0 w-full max-w-[1120px] flex-1 lg:max-h-[820px]">
            <Post memory={memory} />
          </div>
        ) : temporaryError ? (
          <div className="mx-auto p-4">
            <Button variant="outline" onClick={retry}>Retry loading story</Button>
          </div>
        ) : (
          <div className="mx-auto mt-8 w-full max-w-235 px-4">
            <div className="rounded-xl border border-stroke-neutral-weak bg-bg-neutral-solid p-8 text-center">
              <h1 className="font-garamond text-3xl text-text-neutral-strong">
                This story isn’t available
              </h1>
              <p className="mt-2 font-inter text-sm text-text-neutral-weak">
                {signedIn
                  ? "It may be private or have been removed. Ask the person who shared it to check who can see it."
                  : "It may be private or have been removed. If it was shared with you, log in to read it."}
              </p>
              {!signedIn && hydrated ? (
                <Button asChild variant="outline" className="mt-5">
                  <Link to={loginPath}>Log in</Link>
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </main>
      {/* Attachment previews open through the modal stack. */}
      <Modal />
    </div>
  );
}

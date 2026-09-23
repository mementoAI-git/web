import useSWR from "swr";
import { useParams } from "react-router-dom";
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
  const { data, error, isLoading } = useSWR<IResponse<IPublicMemory>>(
    id ? `${endpoint.publicMemory}/${id}` : null,
  );
  const memory = data?.data;

  return (
    <div className="min-h-screen w-screen bg-background">
      <header className="flex max-h-[96px] w-full max-w-[1440px] items-center justify-between border-b border-[#0011661A] px-20 py-6">
        <Logo />
        {!hydrated ? (
          <div className="h-12 min-w-38 rounded-lg bg-gray-200" />
        ) : (
          isEmpty(auth?.access_token) && (
            <button
              className="flex h-12 cursor-pointer items-center justify-center rounded-lg bg-primary px-4 font-geist font-bold text-white"
              type="button"
            >
              Join Memento
            </button>
          )
        )}
      </header>
      <main className="mx-auto p-8">
        <div className="mx-auto w-full max-w-235">
          {isLoading ? (
            <Loading />
          ) : memory ? (
            <Post memory={memory} />
          ) : (
            <div className="rounded-xl border border-stroke-neutral-weak bg-white p-8 text-center">
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

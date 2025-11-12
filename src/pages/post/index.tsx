import useSWR from "swr";
import { useParams } from "react-router-dom";
import Logo from "@/components/logo";
import endpoint from "@/api/endpoint";
import { useStore } from "@/hooks/use-store";
import { isEmpty } from "@/utility";
import Loading from "./loading";
import Post from "./post";

export function PostPage() {
  const { auth, hydrated } = useStore();
  const { id = "" } = useParams();
  const { data, isLoading } = useSWR(id ? `${endpoint.memories}/${id}` : null);

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
          {isLoading ? <Loading /> : <Post memory={data?.data} />}
        </div>
      </main>
    </div>
  );
}

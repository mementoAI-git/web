import { Globe, Lock, Users } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import type { IResponse } from "@/api/interface";
import { Button } from "@/components/ui/button";
import useFetcher from "@/hooks/use-fetcher";
import type { IMemory } from "@/utility/interface";

/** Says who can open a story's link. Visibility only changes when the owner asks. */
export function ShareLinkAccess({ memoryId }: { memoryId: string }) {
  const key = `${endpoint.memories}/${memoryId}`;
  const { data, mutate } = useSWR<IResponse<IMemory>>(key);
  const { trigger, isMutating } = useFetcher(key, "put", {
    populateCache: false,
    revalidate: false,
  });
  const memory = data?.data;
  if (!memory) return null;

  const makeVisible = async () => {
    try {
      const response = await trigger({ visibility: "everyone" });
      if (!response?.success) throw new Error(response?.message);
      await mutate({ ...data, data: { ...memory, visibility: "everyone" } }, {
        revalidate: true,
      });
      toast.success("Anyone with the link can now read this story");
    } catch (error) {
      toast.error(
        (error as Error)?.message || "We couldn’t update this story. Try again.",
      );
    }
  };

  if (memory.status === "draft") {
    return (
      <Notice icon={<Lock className="size-4" aria-hidden />}>
        Publish this story before sharing it. Until then, only you can open this
        link.
      </Notice>
    );
  }

  if (memory.visibility === "everyone") {
    return (
      <Notice icon={<Globe className="size-4" aria-hidden />}>
        Anyone with this link can read this story.
      </Notice>
    );
  }

  const audience = [...(memory.groups ?? []), ...(memory.beneficiaries ?? [])];
  if (audience.length > 0) {
    return (
      <Notice icon={<Users className="size-4" aria-hidden />}>
        Only you and {audience.map((item) => item.name).join(", ")} can open this
        link. They’ll need to log in.
      </Notice>
    );
  }

  return (
    <Notice icon={<Lock className="size-4" aria-hidden />}>
      <p className="font-medium text-text-neutral-strong">
        This story is private, so only you can open this link.
      </p>
      <p className="mt-1">
        Make it visible to everyone so anyone with the link can read it. People
        you’re connected with will see it too.
      </p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="mt-3"
        disabled={isMutating}
        onClick={makeVisible}
      >
        {isMutating ? "Updating…" : "Make visible to everyone"}
      </Button>
    </Notice>
  );
}

function Notice({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      className="flex gap-2.5 rounded-lg border border-stroke-neutral-weak bg-fill-neutral-weaker p-3 text-left font-inter text-sm text-text-neutral-weak"
    >
      <span className="mt-0.5 shrink-0 text-icon-neutral-weak">{icon}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

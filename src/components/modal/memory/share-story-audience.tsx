import { useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import type { IResponse } from "@/api/interface";
import useFetcher from "@/hooks/use-fetcher";
import type { IMemory } from "@/utility/interface";
import { AccessField } from "./create/access-field";
import { createStoryEditDraft, type StoryEditDraft } from "./story-edit-state";

type Audience = Pick<StoryEditDraft, "visibility" | "access">;

/** Saves each audience the owner picks. Opening the dialog or copying the link never changes it. */
export function ShareStoryAudience({ memoryId }: { memoryId: string }) {
  const key = `${endpoint.memories}/${memoryId}`;
  const { data, mutate } = useSWR<IResponse<IMemory>>(key);
  const { trigger } = useFetcher(key, "put", {
    populateCache: false,
    revalidate: false,
  });
  const [audience, setAudience] = useState<Audience | null>(null);
  const latest = useRef<Audience | null>(null);
  const lastSent = useRef<Audience | null>(null);
  const saves = useRef(Promise.resolve());

  const memory = data?.data;
  if (!memory) return null;

  if (memory.status === "draft") {
    return (
      <p className="text-sm text-text-neutral-weak">
        Publish this story before sharing it. Until then, only you can open this
        link.
      </p>
    );
  }

  const saved = createStoryEditDraft(memory);
  const current = audience ?? saved;

  // One choice fires two callbacks, and a later choice must not race an earlier one,
  // so saves run in order and each sends whatever is newest when its turn comes.
  const saveLatest = async () => {
    const next = latest.current;
    if (!next || next === lastSent.current) return;
    lastSent.current = next;
    try {
      const response = await trigger({
        visibility: next.visibility,
        groups: next.access
          .filter((item) => item.source === "group")
          .map((item) => item.id),
        beneficiaries: next.access
          .filter((item) => item.source === "beneficiary")
          .map((item) => item.id),
      });
      if (!response?.success) throw new Error(response?.message);
      await mutate();
      toast.success(
        next.visibility === "everyone"
          ? "Anyone with the link can now read this story"
          : "Story visibility updated",
      );
    } catch (error) {
      latest.current = null;
      lastSent.current = null;
      setAudience(null);
      await mutate();
      toast.error(
        (error as Error)?.message || "We couldn’t update this story. Try again.",
      );
    }
  };

  const change = (patch: Partial<Audience>) => {
    const next = { ...(latest.current ?? saved), ...patch };
    latest.current = next;
    setAudience(next);
    saves.current = saves.current.then(saveLatest);
  };

  return (
    <AccessField
      value={current.access}
      onChange={(access) => change({ access })}
      shareAudience={current.visibility}
      onShareAudienceChange={(visibility) => change({ visibility })}
      variant="panel"
      dismissOnEscape
    />
  );
}

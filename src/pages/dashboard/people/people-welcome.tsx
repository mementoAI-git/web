import { Button } from "@/components/ui/button";

export function PeopleWelcome({
  hasPeople,
  loading,
  onInvite,
}: {
  hasPeople: boolean;
  loading: boolean;
  onInvite: () => void;
}) {
  return (
    <div className="people-welcome flex h-full min-h-0 flex-col overflow-y-auto px-6 py-10 sm:px-10 sm:py-14">
      <div className="my-auto w-full max-w-lg self-center rounded-2xl border border-stroke-neutral-weak bg-bg-neutral p-8 sm:p-10">
        <h2 className="font-garamond text-4xl leading-tight text-text-neutral-strong">
          {hasPeople || loading
            ? "A little of life, shared."
            : "No connections yet"}
        </h2>
        <p className="mt-3 text-sm leading-6 text-text-neutral-weak">
          {hasPeople
            ? "Choose someone to see your memories together."
            : loading
              ? "Loading your connections…"
              : "Invite someone to start sharing memories."}
        </p>
        {!loading && (
          <Button
            size="form"
            className="people-control mt-6"
            onClick={onInvite}
          >
            Invite someone
          </Button>
        )}
      </div>
    </div>
  );
}

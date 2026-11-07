export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading story"
      className="mx-auto w-full max-w-[760px] animate-pulse space-y-5 p-6"
    >
      <div className="h-10 w-3/5 rounded bg-fill-neutral-weaker" />
      <div className="space-y-3">
        <div className="h-4 w-full rounded bg-fill-neutral-weaker" />
        <div className="h-4 w-5/6 rounded bg-fill-neutral-weaker" />
        <div className="h-4 w-2/3 rounded bg-fill-neutral-weaker" />
      </div>
    </div>
  );
}

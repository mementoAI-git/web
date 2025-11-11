export default function Loading() {
  return (
    <div className="w-full space-y-5">
      <div className="space-y-3">
        <div className="h-7 w-1/2 rounded bg-gray-200" />
        <div className="h-20 w-full rounded-xl bg-gray-200" />
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="h-50 w-61.5 shrink-0 rounded bg-gray-200" />
        <div className="h-50 min-w-94 rounded bg-gray-200" />
        <div className="h-50 w-61.5 shrink-0 rounded bg-gray-200" />
        <div className="h-50 min-w-94 rounded bg-gray-200" />
        <div className="h-50 w-61.5 shrink-0 rounded bg-gray-200" />
        <div className="h-50 w-61.5 shrink-0 rounded bg-gray-200" />
      </div>
      <div className="h-100 w-full rounded bg-gray-200" />
    </div>
  );
}


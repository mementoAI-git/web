import EmptyIcon from "@/public/icon/docs-clip.svg";

export default function EmptyRecentMemories() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center text-grey-600">
      <EmptyIcon width={48} height={48} className="mb-2 opacity-40" />
      <div className="font-inter font-semibold text-base mb-1">No recently opened memories</div>
      <div className="font-inter text-sm">Your recently opened memories will appear here.</div>
    </div>
  );
}
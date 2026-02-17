type CapsuleStatus = "draft" | "scheduled" | "delivered" | "paused" | "failed" | "deleted";

export default function StatusBadge({ status }: { status: CapsuleStatus }) {
  const config = {
    draft: {
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
      label: "Drafts",
      icon: null,
    },
    scheduled: {
      bg: "bg-[#fffaeb]",
      text: "text-[#B54708]",
      border: "border-[#FEDF89]",
      label: "Scheduled",
    },
    delivered: {
      bg: "bg-[#ECFDF3]",
      text: "text-[#067647]",
      border: "border-[#ABEFC6]",
      label: "Delivered",
    },
  };

  const style = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}
    >
      {style.label}
    </span>
  );
}

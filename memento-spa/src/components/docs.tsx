import { FileIcon } from "@/components/icons";

const fileColors: Record<string, string> = {
  pdf: "bg-red-800",
  png: "bg-primary",
  mp4: "bg-[#314FDF]",
};

export default function Docs({ name }: { name: string }) {
  const extension = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  const badgeClass = fileColors[extension] || "bg-primary";

  return (
    <div className="relative h-10 w-8 text-[#D5D7DA]">
      <FileIcon className="size-full" />
      <span className={`absolute -left-2 bottom-1 rounded-[3px] px-[3px] text-[10px] font-bold uppercase text-white ${badgeClass}`}>
        {extension}
      </span>
    </div>
  );
}


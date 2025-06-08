import FileIcon from "@/public/icon/file.svg"

const fileColors: Record<string, string> = {
  pdf: "bg-red-800",
  png: "bg-primary",
  mp4: "bg-[#314FDF]"
}

export default function Docs({ name }) {
  const ext = name.slice(name.lastIndexOf('.') + 1)
  return (
    <div className="w-8 h-10 relative text-[#D5D7DA]">
      <FileIcon />
      <span className={`absolute uppercase bottom-1 -left-2 p-[3px] ${fileColors[ext.toLowerCase()] || "bg-primary"}  text-[10px] font-bold font-inter rounded-[3px] text-white`}>
        {ext}
      </span>
    </div>
  )
}
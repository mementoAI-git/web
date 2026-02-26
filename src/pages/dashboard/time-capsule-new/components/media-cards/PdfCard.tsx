import { FileIcon } from "@/components/icons";
import TextHighlight from "../TextHighlight";
import { getAdjustedBackground } from "./helpers";
import type { CardCustomization } from "../CapsulePreviewCard";

interface PdfCardProps {
    title: string;
    onClick?: () => void;
    className?: string;
    style?: CardCustomization;
}

export default function PdfCard({
    title = "",
    onClick,
    className = "",
    style,
}: PdfCardProps) {
    return (
        <div onClick={onClick} className={`${className} overflowhidden`}>
            {/* Preview - Fixed 136×162 aspect ratio */}
            <div className="relative w-full aspect68/81 mb-3 bg-white rounded-2xl overflow-hidden cursor-pointer group flex flex-col items-center justify-center p-6">
                {/* Background decorative elements (similar to AudioCard but distinct for PDF) */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-red-50/50 rounded-bl-full pointer-events-none transition-colors group-hover:bg-red-100/50" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-gray-50/50 rounded-tr-full pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-red-50 rounded-xl flex items-center justify-center text-red-500 transition-transform group-hover:scale-110">
                        <FileIcon className="w-8 h-8" />
                    </div>
                    <span className="text-xs font-bold text-red-500/80 tracking-widest uppercase">
                        PDF
                    </span>
                </div>
            </div>

            <TextHighlight
                style={{
                    backgroundColor: getAdjustedBackground(
                        style?.backgroundColor,
                        style?.textColor || "#ffffff",
                    ),
                }}
            >
                {title || "Document.pdf"}
            </TextHighlight>
        </div>
    );
}

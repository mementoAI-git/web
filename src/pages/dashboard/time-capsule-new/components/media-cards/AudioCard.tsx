import TextHighlight from "../TextHighlight";

// components/media-cards/AudioCard.tsx
interface AudioCardProps {
  duration: string;
  title: string;
  onClick?: () => void;
  className?: string;
}

export default function AudioCard({
  duration,
  title = "",
  onClick,
  className = "",
}: AudioCardProps) {
  return (
    <div className={className}>
      {/* Preview - Fixed 136×162 aspect ratio */}
      <div
        onClick={onClick}
        className="relative w-full aspect-68/81 mb-3 bg-white rounded-2xl overflow-hidden cursor-pointer group"
      >
        {/* Background decorative curves */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <svg
            viewBox="0 0 200 200"
            className="absolute -top-10 -left-10 w-40 h-40 text-gray-100"
            fill="currentColor"
          >
            <circle cx="100" cy="100" r="80" opacity="0.5" />
          </svg>
          <svg
            viewBox="0 0 200 200"
            className="absolute -bottom-10 -right-10 w-48 h-48 text-gray-50"
            fill="currentColor"
          >
            <circle cx="100" cy="100" r="90" opacity="0.3" />
          </svg>
        </div>

        {/* Audio waveform - scaled for taller aspect */}
        <div className="absolute inset-0 flex items-center justify-center pb-4">
          <div className="flex items-end gap-[3px]">
            {[12, 24, 36, 28, 40, 32, 44, 28, 36, 20, 32, 16].map((h, i) => (
              <div
                key={i}
                className="w-[3px] bg-gray-400 rounded-full transition-all group-hover:bg-gray-500"
                style={{ height: `${h}px` }}
              />
            ))}
          </div>
        </div>

        {/* Duration - positioned lower for taller card */}
        <div className="absolute inset-0 flex items-center justify-center pt-20">
          <span className="text-lg font-medium text-gray-700">{duration}</span>
        </div>
      </div>

      {/* Title - Outside the card */}
      {/*<TextHighlight>{title}</TextHighlight>*/}
      <TextHighlight>
        This is a very long title that needs three linesThis is a very long
        title that needs three linesThis is a very long title that needs three
        linesThis is a very long title that needsthreelines
      </TextHighlight>
    </div>
  );
}

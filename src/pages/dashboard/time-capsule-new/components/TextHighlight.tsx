interface TextHighlightProps {
  children: string;
  className?: string;
  style?: React.CSSProperties;
  lines?: string[];
  maxLines?: number;
}

export default function TextHighlight({
  children,
  className = "",
  style = {},
  lines,
  maxLines = 2,
}: TextHighlightProps) {
  const computedLines = lines || autoSplitLines(children, maxLines);
  const displayLines = computedLines.slice(0, maxLines);
  const hasMore = computedLines.length > maxLines;

  return (
    <div
      className={`inline-flex flex-col items-center w-full ${className}`}
      style={{
        padding: 0,
        gap: 0,
        minWidth: 0, // Allow flex item to shrink
      }}
    >
      <div className="inline-flex flex-col items-center w-full min-w-0">
        {displayLines.map((line, index) => {
          const isLastLine = index === displayLines.length - 1;
          const showEllipsis = isLastLine && hasMore;

          return (
            <span
              key={index}
              className="inline-block px-1.5 py-0.5 text-[10px] font-medium text-gray-900 text-center bg-sand-2"
              style={{
                backgroundColor: style.backgroundColor || "#E8E5DA",
                borderRadius: "6px",
                lineHeight: "1.2",
                position: "relative",
                marginTop: index > 0 ? "-2px" : "0",
                zIndex: displayLines.length - index,
                maxWidth: "100%", // Respect parent width
                minWidth: 0, // Allow shrinking
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                ...style,
              }}
              title={line}
            >
              {showEllipsis ? line : line}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function autoSplitLines(text: string, maxLines: number = 2): string[] {
  if (!text || text.trim().length === 0) return [];

  const words = text.trim().split(/\s+/);

  // If 2 words or less, return single line
  if (words.length <= 2) {
    return [text.trim()];
  }

  // For strict 2-line limit with ellipsis, we need to be smarter
  // Return first half and second half (which may get truncated by CSS)
  const midPoint = Math.ceil(words.length / 2);

  return [
    words.slice(0, midPoint).join(" "),
    words.slice(midPoint).join(" "),
  ].filter(Boolean);
}

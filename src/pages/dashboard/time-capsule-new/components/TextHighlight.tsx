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
  const computedLines = lines || autoSplitLines(children);
  const displayLines = computedLines.slice(0, maxLines);
  const hasMore = computedLines.length > maxLines;

  return (
    <div
      className={`inline-flex flex-col items-center w-full ${className}`}
      style={{
        padding: 0,
        gap: 0,
      }}
    >
      <div className="inline-flex flex-col items-center">
        {displayLines.map((line, index) => (
          <span
            key={index}
            className="inline-block px-1.5 py-0.5 text-[10px] font-medium text-gray-900 text-center"
            style={{
              backgroundColor: style.backgroundColor || "#E8E5DA",
              borderRadius: "6px",
              lineHeight: "1.2",
              position: "relative",
              marginTop: index > 0 ? "-2px" : "0",
              zIndex: displayLines.length - index,
              maxWidth: "150px",
              wordWrap: "break-word",
              ...style,
            }}
          >
            {index === maxLines - 1 && hasMore ? `${line}...` : line}
          </span>
        ))}
      </div>
    </div>
  );
}

function autoSplitLines(text: string): string[] {
  const words = text.split(" ");
  if (words.length <= 2) {
    return [text];
  }

  let splitIndex = words.length - 1;
  for (let i = words.length - 1; i >= 1; i--) {
    const firstLine = words.slice(0, i).join(" ");
    const secondLine = words.slice(i).join(" ");
    if (firstLine.length >= secondLine.length) {
      splitIndex = i;
      break;
    }
  }

  return [
    words.slice(0, splitIndex).join(" "),
    words.slice(splitIndex).join(" "),
  ].filter(Boolean);
}

interface TextHighlightProps {
  children: string;
  className?: string;
  lines?: string[];
}

export default function TextHighlight({
  children,
  className = "",
  lines,
}: TextHighlightProps) {
  const computedLines = lines || autoSplitLines(children);

  return (
    <div
      className={`flex flex-col items-center overflow-visible ${className}`}
      style={{ "--line-compression": "-0.22rem" } as React.CSSProperties}
    >
      {computedLines.map((line, index) => (
        <span
          key={index}
          className={`
            bg-white
            px-2
            py-[0.15rem]
            rounded-lg
            text-xs
            font-medium
            text-gray-900
            leading-tight
            relative
            ${index > 0 ? "mt-(--line-compression)" : ""}
          `}
          style={{ zIndex: computedLines.length - index }}
        >
          {line}
        </span>
      ))}
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

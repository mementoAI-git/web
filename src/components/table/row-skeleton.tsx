interface TableRowSkeletonProps {
  col?: number;
}

export default function TableRowSkeleton({ col = 3 }: TableRowSkeletonProps) {
  return [0, 1, 2].map((row) => (
    <tr key={row} className="animate-pulse">
      {Array.from({ length: col }).map((_, index) => (
        <td key={index} className="px-4 py-3">
          <div className="h-3 w-full max-w-18 rounded bg-v3-fill-weaker" />
        </td>
      ))}
    </tr>
  ));
}


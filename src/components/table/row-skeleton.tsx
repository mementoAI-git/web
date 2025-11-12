interface TableRowSkeletonProps {
  col?: number;
}

export default function TableRowSkeleton({ col = 3 }: TableRowSkeletonProps) {
  return [0, 1, 2].map((row) => (
    <tr key={row} className="animate-pulse">
      {Array.from({ length: col }).map((_, index) => (
        <td key={index}>
          <div className="h-3 w-full max-w-18 rounded bg-gray-200" />
        </td>
      ))}
    </tr>
  ));
}


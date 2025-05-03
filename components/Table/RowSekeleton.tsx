
export default function TableRowSekeleton({ col = 3 }) {
  return [1, 2, 3].map(i => (
    <tr key={i} className="animate-pulse">
      {
        [...Array(col).fill(0)].map((_, i) => (
          <td key={i}>
            <div className="h-3 w-full max-w-18 bg-gray-200 rounded" />
          </td>
        ))
      }
    </tr>
  ))
}
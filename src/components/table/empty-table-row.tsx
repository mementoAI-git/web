interface EmptyTableRowProps {
  colSpan: number;
  title: string;
  description: string;
}

export default function EmptyTableRow({ colSpan, title, description }: EmptyTableRowProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12">
        <div className="flex flex-col items-center justify-center text-center">
          <p className="font-inter text-sm font-medium text-gray-700">{title}</p>
          <p className="font-inter text-xs text-gray-500 mt-1">{description}</p>
        </div>
      </td>
    </tr>
  )
}
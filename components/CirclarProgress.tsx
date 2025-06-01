
interface ICirclarProgress {
  progress?: number
  className?: string
}
export default function CirclarProgress({ className = "", progress = 0 }: ICirclarProgress) {
  progress = Math.min(progress, 100)
  return (
    <div className={`${className}`}>
      <svg className="w-full h-full" viewBox="0 0 36 36">
        <path
          className="text-gray-300"
          d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          className="text-primary"
          strokeDasharray={`${progress}, 100`}
          d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <text
          x="18"
          y="20.35"
          className="text-xs fill-primary"
          textAnchor="middle"
        >
          {progress}%
        </text>
      </svg>
    </div>
  )
}
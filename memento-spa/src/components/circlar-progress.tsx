interface CirclarProgressProps {
  progress?: number;
  className?: string;
}

export default function CirclarProgress({ className = "", progress = 0 }: CirclarProgressProps) {
  const clampedProgress = Math.min(progress, 100);
  return (
    <div className={className}>
      <svg className="h-full w-full" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          className="text-gray-300"
          d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
          stroke="currentColor"
          strokeWidth={2}
          fill="none"
        />
        <path
          className="text-primary"
          strokeDasharray={`${clampedProgress}, 100`}
          d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
          stroke="currentColor"
          strokeWidth={2}
          fill="none"
        />
        <text x="18" y="20.35" className="fill-primary text-xs" textAnchor="middle">
          {clampedProgress}%
        </text>
      </svg>
    </div>
  );
}

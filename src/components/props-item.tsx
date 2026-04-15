import type { ReactElement } from "react";

interface PropsItemProps {
  title: string;
  subtitle?: string | ReactElement | null;
  icon: ReactElement;
  className?: string;
  onClick?: () => void;
}

export default function PropsItem({
  title,
  icon,
  subtitle = null,
  className = "",
  onClick,
}: PropsItemProps) {
  return (
    <li
      onClick={onClick}
      className={`flex items-center gap-2 py-2 font-inter text-xs font-normal capitalize text-grey-800 ${className}`}
    >
      <div className="shrink-0">{icon}</div>
      <span className="text-xs text-v3-text-weak">{title}</span>
      <strong className="text-xs font-medium text-v3-text-strong">{subtitle}</strong>
    </li>
  );
}


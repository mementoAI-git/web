interface IPropsItem {
  title: string;
  subtitle?: string | React.ReactElement | null;
  icon: React.ReactElement;
  className?: string;
  onClick?: () => void;
}

export default function PropsItem({ title, icon, subtitle = null, className, onClick }: IPropsItem) {
  return (
    <li
      onClick={onClick || null}
      className={`flex items-center gap-2 font-inter text-xs font-normal text-grey-800 capitalize ${className}`}
    >
      <div className="shrink-0">{icon}</div>
      <span>{title} </span>
      <strong className="text-sm font-medium text-grey-600">{subtitle}</strong>
    </li>
  );
}
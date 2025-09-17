
interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export default function Switch({ checked = false, onCheckedChange, disabled = false }: SwitchProps) {
  const handleClick = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked);
    }
  };

  return (
    <div
      className={`rounded-full p-0.5 w-9 h-5 flex items-center transition-colors duration-200 cursor-pointer ${checked ? 'bg-blue-6' : 'bg-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handleClick}
    >
      <div
        className={`size-4 rounded-full bg-white transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'
          }`}
      />
    </div>
  );
}
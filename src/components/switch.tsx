interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export default function Switch({ checked = false, onCheckedChange, disabled = false }: SwitchProps) {
  const handleClick = () => {
    if (!disabled) {
      onCheckedChange?.(!checked);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex h-5 w-9 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ${
        checked ? "bg-blue-6" : "bg-gray-300"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <div
        className={`h-4 w-4 rounded-full bg-white transition-transform duration-200 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </div>
  );
}


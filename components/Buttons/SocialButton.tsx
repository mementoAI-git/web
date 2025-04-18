import React, { ButtonHTMLAttributes } from "react";

interface IButton extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  icon: React.ReactElement;
}

export function SocialButton({ icon, title, ...props }: IButton) {
  return (
    <button
      {...props}
      className="flex max-h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-grey-100 bg-white px-4 py-[10px] shadow-sm disabled:opacity-65"
    >
      {icon}
      <span className="font-inter text-base font-medium">{title}</span>
    </button>
  );
}

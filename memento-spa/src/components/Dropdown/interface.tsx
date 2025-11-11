import type { ReactElement, ReactNode } from "react";

export interface IDropdownItem {
  label: string;
  value: string;
  startIcon?: ReactElement;
}

export interface IDropdownIcon extends IDropdownMenu {
  icon?: ReactElement;
}

export interface IDropdownButton {
  title: ReactNode;
  onSelect: (value: string) => void;
  items: IDropdownItem[];
  ItemLayout?: ({ onClick, item }: IDropdownOption) => ReactElement;
  className?: string;
  value?: string;
}

export interface IDropdownMenu {
  ItemLayout?: ({ onClick, item, value }: IDropdownOption) => ReactElement;
  onSelect: (value: string) => void;
  items: IDropdownItem[];
  footerItem?: ReactElement;
  className?: string;
  value?: string;
}

export interface IDropdownOption {
  onClick: (value: string) => void;
  item: IDropdownItem;
  value?: string;
}

import React from "react";

export interface IDropdownItem {
  label: string;
  value: string;
  startIcon?: React.ReactElement;
}

export interface IDropdownIcon extends IDropdownMenu {
  icon?: React.ReactElement;
}

export interface IDropdownButton {
  title: React.ReactNode;
  onSelect: (value: string) => void;
  items: { label: string; value: string }[];
  ItemLayout?: ({ onClick, item }: IDropdownOption) => React.JSX.Element;
  className?: string;
  value?: string;
}

export interface IDropdownMenu {
  ItemLayout?: React.FC<IDropdownOption>;
  onSelect: (value: string) => void;
  items: IDropdownItem[];
  footerItem?: React.ReactElement;
  className?: string;
  value?: string;
}

export interface IDropdownOption {
  onClick: (v: string) => void;
  item: IDropdownItem;
  value?: string;
}

import React from "react"

export interface IDropdownItem {
  label: string
  value: string
  startIcon?: React.ReactElement
}

export interface IDropdownIcon extends IDropdownMenu {
  icon: React.ReactElement
}

export interface IDropdownButton extends IDropdownMenu {
  title: React.ReactElement | string
}

export interface IDropdownMenu {
  ItemLayout?: React.FC<IDropdownOption>
  onSelect: (value: string) => void
  items: IDropdownItem[]
  footerItem?: React.ReactElement
  className?: string
}

export interface IDropdownOption {
  onClick: (v: string) => void
  item: IDropdownItem
}
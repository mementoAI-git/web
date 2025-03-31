import React from "react"

export interface IDropdownItem {
  label: string
  value: string
  startIcon?: React.ReactElement
}

export interface IDropdown {
  title: React.ReactElement | string
  ItemLayout?: React.FC<{ item: IDropdownItem | string }>
  onSelect: (value: string) => void
  items: (IDropdownItem | string)[]
}

export interface IDropdownMenu {
  ItemLayout?: React.FC<{ item: IDropdownItem | string }>
  onSelect: (value: string) => void
  items: (IDropdownItem | string)[]
  footerItem?: React.ReactElement
  className?: string
}

export interface IDropdownOption {
  onClick: (v: string) => void
  item: IDropdownItem | string
}
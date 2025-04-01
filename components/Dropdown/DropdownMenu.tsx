"use client"

import { Fragment, useRef } from "react"
import { DefaultDropdownOption } from "./DropdownOptions"
import { IDropdownMenu } from "./interface"

export function DropdowmMenu({ items, ItemLayout, onSelect, footerItem, className = "" }: IDropdownMenu) {
  const ref = useRef<any>(null)

  return (
    <ul ref={ref} className={`absolute top-full left-0 min-w-[167px] rounded-lg shadow-[2px_4px_12px_0px_rgba(0,0,0,0.25)] bg-white h-fit p-2 mt-1.5 z-50 ${className}`}>
      {
        items.map((item, i) => (
          ItemLayout ?
            <ItemLayout key={i} item={item} onClick={onSelect} /> :
            <DefaultDropdownOption key={i} onClick={onSelect} item={item} />
        ))
      }
      {
        footerItem &&
        <Fragment>
          <div className="w-full border-t border-[#EAECF0]" />
          {footerItem}
        </Fragment>
      }
    </ul>
  )
}
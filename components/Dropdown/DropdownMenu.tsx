"use client";

import { Fragment, useRef } from "react";
import { DefaultDropdownOption } from "./DropdownOptions";
import { IDropdownMenu } from "./interface";

export function DropdowmMenu({
  items,
  ItemLayout,
  value,
  onSelect,
  footerItem,
  className = "top-full left-0",
}: IDropdownMenu) {
  const ref = useRef<HTMLUListElement>(null);

  return (
    <ul
      ref={ref}
      className={`absolute z-50 mt-1.5 h-fit min-w-[167px] rounded-lg bg-white p-2 shadow-[2px_4px_12px_0px_rgba(0,0,0,0.25)] ${className}`}
    >
      {items.map((item, i) =>
        ItemLayout ? (
          <ItemLayout key={i} item={item} value={value} onClick={onSelect} />
        ) : (
          <DefaultDropdownOption key={i} onClick={onSelect} item={item} />
        ),
      )}
      {footerItem && (
        <Fragment>
          <div className="w-full my-1 border-t border-[#EAECF0]" />
          {footerItem}
        </Fragment>
      )}
    </ul>
  );
}

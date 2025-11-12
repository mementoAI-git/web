import { Fragment, useRef } from "react";
import type { IDropdownMenu } from "./interface";
import { DefaultDropdownOption } from "./DropdownOptions";

export function DropdowmMenu({
  items = [],
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
      className={`absolute z-50 mt-1.5 h-fit min-w-[167px] rounded-lg bg-white p-1 shadow-[2px_4px_12px_0px_rgba(0,0,0,0.25)] ${className}`}
    >
      {items.map((item, index) =>
        ItemLayout ? (
          <ItemLayout key={index} item={item} value={value} onClick={onSelect} />
        ) : (
          <DefaultDropdownOption key={index} onClick={onSelect} item={item} />
        ),
      )}
      {footerItem && (
        <Fragment>
          <div className="my-1 w-full border-t border-[#EAECF0]" />
          {footerItem}
        </Fragment>
      )}
    </ul>
  );
}

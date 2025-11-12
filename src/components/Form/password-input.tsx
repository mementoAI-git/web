"use client";

import { useState } from "react";
import { Textinput, type ITexinput } from "./text-input";
import { EyeIcon, EyeOffIcon } from "@/components/icons";

export function Passwordinput({ label = "Password", ...props }: ITexinput) {
  const [show, setShow] = useState(false);
  return (
    <Textinput
      end={
        <div
          className="cursor-pointer text-grey-300"
          onClick={() => setShow((p) => !p)}
        >
          {show ? <EyeOffIcon width={20} height={20} /> : <EyeIcon width={20} height={20} />}
        </div>
      }
      type={show ? "text" : "password"}
      placeholder=" • • • • • • •"
      label={label}
      {...props}
    />
  );
}



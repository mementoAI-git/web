"use client";

import { useState } from "react";
import { ITexinput, Textinput } from "./TextInput";
import EyesoffIcon from "@/public/icon/eye-off.svg";
import EyeIcon from "@/public/icon/eye.svg";

export function Passwordinput({ label = "Password", ...props }: ITexinput) {
  const [show, setShow] = useState(false);
  return (
    <Textinput
      end={
        <div
          className="cursor-pointer text-grey-300"
          onClick={() => setShow((p) => !p)}
        >
          {show ? <EyesoffIcon width={16} /> : <EyeIcon width={20} />}
        </div>
      }
      type={show ? "text" : "password"}
      placeholder=" • • • • • • •"
      {...props}
    />
  );
}

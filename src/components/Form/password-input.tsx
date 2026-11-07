"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/icons";
import { InputGroupButton } from "@/components/ui/input-group";
import { Textinput, type ITexinput } from "./text-input";

export function Passwordinput({
  label = "Password",
  autoComplete = "current-password",
  ...props
}: ITexinput) {
  const [show, setShow] = useState(false);
  return (
    <Textinput
      end={
        <InputGroupButton
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-icon-neutral-weak"
          onClick={() => setShow((p) => !p)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
        >
          {show ? <EyeOffIcon width={20} height={20} /> : <EyeIcon width={20} height={20} />}
        </InputGroupButton>
      }
      type={show ? "text" : "password"}
      placeholder=" • • • • • • •"
      label={label}
      autoComplete={autoComplete}
      {...props}
    />
  );
}

import { Textinput, type ITexinput } from "@/components/Form";
import Spinner from "@/components/spinner";
import type { IUser } from "@/utility/interface";
import { cn } from "@/utility";
import {
  profileFieldInputShellClassName,
  profileFieldLabelClassName,
  profileFieldTextInputClassName,
} from "./profile-field-input-classes";
import { useProfileFieldUpdate } from "./use-profile-field-update";

interface UpdateTextInputProps extends Omit<ITexinput, "name" | "value" | "onChange"> {
  name: keyof IUser;
  btnText?: string;
}

export default function UpdateTextInput({
  btnText = "Update",
  name,
  labelClassName,
  inputClassName,
  className,
  ...props
}: UpdateTextInputProps) {
  const { value, setValue, isMutating, save, hasUser } = useProfileFieldUpdate(name);

  return (
    <Textinput
      {...props}
      name={name as string}
      value={value}
      disabled={props.disabled ?? !hasUser}
      onChange={(event) => setValue(event.target.value)}
      className={cn(profileFieldTextInputClassName, className)}
      labelClassName={cn(profileFieldLabelClassName, labelClassName)}
      inputClassName={cn(profileFieldInputShellClassName, inputClassName)}
      end={
        <button
          type="button"
          disabled={isMutating || !hasUser}
          onClick={() => void save()}
          className="cursor-pointer text-sm font-inter font-medium capitalize text-v3-text-weak disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isMutating ? <Spinner loading className="!size-4 !text-v3-text-weak" /> : btnText}
        </button>
      }
    />
  );
}

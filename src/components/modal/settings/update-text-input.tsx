import endpoint from "@/api/endpoint";
import { Textinput, type ITexinput } from "@/components/Form";
import Spinner from "@/components/spinner";
import useFetcher from "@/hooks/use-fetcher";
import { useStore } from "@/hooks/use-store";
import type { IUser } from "@/utility/interface";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface UpdateTextInputProps extends Omit<ITexinput, "name" | "value" | "onChange"> {
  name: keyof IUser;
  btnText?: string;
}

export default function UpdateTextInput({
  btnText = "Update",
  name,
  labelClassName,
  ...props
}: UpdateTextInputProps) {
  const { user, hydrated } = useStore();
  const { isMutating, trigger } = useFetcher(endpoint.profile, "put");
  const [value, setValue] = useState("");

  const cachedValue = useMemo(() => {
    if (!user) return "";
    const fieldValue = user[name];
    if (fieldValue == null) return "";
    return String(fieldValue);
  }, [name, user]);

  const handleUpdate = async () => {
    if (!user) return;
    if (value === cachedValue) return;

    const result = await trigger({ [name]: value });
    if (result?.data) {
      toast.success(result?.message);
    }
  };

  useEffect(() => {
    if (hydrated) {
      setValue(cachedValue);
    }
  }, [cachedValue, hydrated]);

  return (
    <Textinput
      {...props}
      name={name as string}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      labelClassName={`!text-grey-200 !font-normal ${labelClassName ?? ""}`.trim()}
      end={
        <button
          type="button"
          disabled={isMutating}
          onClick={handleUpdate}
          className="cursor-pointer text-sm font-inter font-semibold capitalize text-blue-6"
        >
          {isMutating ? <Spinner loading className="!size-4 !text-blue-6" /> : btnText}
        </button>
      }
    />
  );
}


import endpoint from "@/api/endpoint";
import { ITexinput, Textinput } from "@/components/Form";
import Spinner from "@/components/Spinner";
import useFetcher from "@/hooks/use-fetcher";
import { useStore } from "@/hooks/use-store";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface IUpdateTextinput extends ITexinput {
  btnText?: string
}

export default function UpdateTextinput({ btnText = "Update", name, ...props }: IUpdateTextinput) {
  const { user, hydrated } = useStore()
  const { isMutating, trigger } = useFetcher(endpoint.profile, "put")
  const [value, setValue] = useState("")

  const handleUpdate = async () => {
    if (value === user[name]) return;
    const result = await trigger({ [name]: value })
    if (result?.data) {
      toast.success(result?.message)
    }
  }

  useEffect(() => {
    if (hydrated && user) {
      setValue(user[name])
    }
  }, [user])
  return (
    <Textinput
      {...props}
      value={value}
      name={name}
      onChange={e => setValue(e.target.value)}
      labelClassName="!text-grey-200 !font-normal"
      end={
        <button
          disabled={isMutating}
          onClick={handleUpdate}
          className="text-blue-6 font-semibold font-inter text-sm capitalize cursor-pointer"
        >
          {isMutating ? <Spinner loading className="!size-4 !text-blue-6" /> : btnText}
        </button>
      }
    />
  )
}
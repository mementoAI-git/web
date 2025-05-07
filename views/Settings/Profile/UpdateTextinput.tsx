import endpoint from "@/api/endpoint";
import { ITexinput, Textinput } from "@/components/Form";
import Spinner from "@/components/Spinner";
import useFetcher from "@/hooks/use-fetcher";
import { useStore } from "@/hooks/use-store";
import { useEffect, useState } from "react";

interface IUpdateTextinput extends ITexinput {
  btnText?: string
}

export default function UpdateTextinput({ btnText = "Update", name, ...props }: IUpdateTextinput) {
  const { user, hydrated } = useStore()
  const { isMutating, trigger } = useFetcher(endpoint.profile, "put")
  const [value, setValue] = useState("")

  const handleUpdate = () => {
    if (value === user[name]) return;
    trigger({ [name]: value })
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
          className="text-primary font-semibold font-inter text-sm capitalize cursor-pointer"
        >
          {isMutating ? <Spinner loading className="!size-4 !text-primary" /> : btnText}
        </button>
      }
    />
  )
}
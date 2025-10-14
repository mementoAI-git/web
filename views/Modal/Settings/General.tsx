import { cn, isEmpty, toBase64 } from "@/utility";
import LogoutIcon from "@/public/icon/logout.svg";
import { useStore } from "@/hooks/use-store";
import { useRouter } from "next/navigation";
import UpdateTextinput from "./UpdateTextinput";
import { Textinput } from "@/components/Form";
import avatarPlaceholder from "@/public/image/avatar.png"
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import useSWRMutation from "swr/mutation";
import { fileUploadFetcher } from "@/api/fetcher";
import endpoint from "@/api/endpoint";
import Spinner from "@/components/Spinner";
import { mutate } from "swr";

export default function General() {
  const { user, unsetAuth } = useStore()
  const [previewImage, setPreviewImage] = useState(user?.picture_url)
  const { trigger, isMutating } = useSWRMutation(endpoint.uploadPicture, fileUploadFetcher)

  const handleUpload = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files[0]
    setPreviewImage(await toBase64(file))
    await trigger({ file })
    mutate(endpoint.profile)
  }, [])

  useEffect(() => {
    setPreviewImage(user?.picture_url)
  }, [user?.picture_url])

  const router = useRouter()
  const handleLogout = () => {
    unsetAuth()
    router.push("/login")
  }
  return (
    <div className="w-full flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <span className="font-inter text-base font-bold text-gray-950/90">General</span>
        <span className="font-inter text-sm text-gray-950/70">Manage your Memento profile</span>
      </div>
      <div className="flex justify-between">
        <div className="flex gap-4">
          <div className="size-[50px] overflow-hidden relative rounded-[14px] bg-gray-950/4">
            <img
              alt="Profile"
              width={72}
              height={72}
              src={!isEmpty(previewImage) ? previewImage : avatarPlaceholder.src}
              className="size-full object-cover"
            />
            {
              isMutating &&
              <div className="absolute top-0 left-0 right-0 bg-black/15 size-full flex justify-center items-center">
                <Spinner loading className="!size-6 !mr-0" />
              </div>
            }
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-garamond text-2xl font-medium text-gray-950/90">John Doe</span>
            <span className="font-inter text-sm text-gray-950/70">treehousegrids@gmail.com</span>
            <label htmlFor="file" className="font-inter cursor-pointer py-2 px-3 border border-black/10 text-xs rounded-full font-medium text-center text-gray-950/90">
              Edit photo
              <input id="file" type="file" accept="image/*" hidden name="file" onChange={handleUpload} />
            </label>
          </div>
        </div>
        <div>
          <div onClick={handleLogout} className={cn("icon-container", "!size-9 !rounded-[10px]")}>
            <LogoutIcon className="size-5 stroke-2" />
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-2xl p-4 flex flex-col gap-4">
        <UpdateTextinput label="First name" name="first_name" />
        <UpdateTextinput label="Last name" name="last_name" />
        <Textinput
          label="Location"
          labelClassName="!text-grey-200 !font-normal"
          end={<span className="text-blue-6 font-semibold font-inter text-sm cursor-pointer">Change</span>}
        />
        <UpdateTextinput
          label="Phone number"
          name="phone_number"
          btnText={isEmpty(user?.phone_number) ? "Add Phone number" : "Change Phone number"}
        />
      </div>
    </div>
  )
}
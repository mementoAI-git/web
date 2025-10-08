import avatarPlaceholder from "@/public/image/avatar.png"
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import useSWRMutation from "swr/mutation";
import { fileUploadFetcher } from "@/api/fetcher";
import endpoint from "@/api/endpoint";
import Spinner from "@/components/Spinner";
import { mutate } from "swr";
import { isEmpty, toBase64 } from "@/utility";

export default function ChangeImage({ image }) {
  const [previewImage, setPreviewImage] = useState(image)
  const { trigger, isMutating } = useSWRMutation(endpoint.uploadPicture, fileUploadFetcher)

  const handleUpload = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files[0]
    setPreviewImage(await toBase64(file))
    await trigger({ file })
    mutate(endpoint.profile)
  }, [])

  useEffect(() => {
    setPreviewImage(image)
  }, [image])
  return (
    <div className="w-full rounded-2xl sm:py-8 p-5 sm:px-10 bg-grey-700 flex items-center gap-3">
      <input type="file" accept="image/*" hidden name="file" />
      <div className="relative overflow-hidden size-18 rounded-full bg-black/15">
        <img
          alt="Profile"
          width={72}
          height={72}
          src={!isEmpty(previewImage) ? previewImage : avatarPlaceholder.src}
          className="rounded-full size-full object-cover"
        />
        {
          isMutating &&
          <div className="absolute top-0 left-0 right-0 bg-black/15 size-full flex justify-center items-center">
            <Spinner loading className="!size-10 !mr-0" />
          </div>
        }
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="file" className="border-primary shadow-md cursor-pointer border rounded-lg px-3 py-1 text-sm text-primary font-bold max-w-32.5">
          Change Image
          <input id="file" type="file" accept="image/*" hidden name="file" onChange={handleUpload} />
        </label>
        <span className="font-inter text-grey-200 uppercase">PNG, JPEG 500 x 500px </span>
      </div>
    </div>
  )
}
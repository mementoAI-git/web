import Image from "next/image";
import image1 from "@/public/image/image-1.jpeg"
import { ChangeEvent, useCallback } from "react";
import useSWRMutation from "swr/mutation";
import { fileUploadFetcher } from "@/api/fetcher";
import endpoint from "@/api/endpoint";
import Spinner from "@/components/Spinner";
import { mutate } from "swr";

export default function ChangeImage({ image = image1 }) {
  const { trigger, isMutating } = useSWRMutation(endpoint.uploadPicture, fileUploadFetcher)

  const handleUpload = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files[0]
    await trigger({ file })
    mutate(endpoint.profile)
  }, [])
  return (
    <div className="w-full rounded-2xl py-8 px-10 bg-grey-700 flex items-center gap-3">
      <input type="file" accept="image/*" hidden name="file" />
      <div className="relative overflow-hidden size-18 rounded-full bg-black/15">
        <Image alt="" width={72} height={72} src={image} className="rounded-full size-full object-cover" />
        {
          isMutating &&
          <div className="absolute top-0 left-0 right-0 bg-black/15 size-full flex justify-center items-center">
            <Spinner loading className="!size-10 mx-auto !mr-0" />
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
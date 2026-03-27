import { type ChangeEvent, useCallback, useEffect, useState } from "react";
import useSWRMutation from "swr/mutation";
import { mutate } from "swr";
import endpoint from "@/api/endpoint";
import { fileUploadFetcher } from "@/api/fetcher";
import { useStore } from "@/hooks/use-store";
import { toBase64 } from "@/utility";

export function useProfileAvatarUpload() {
  const { user } = useStore();
  const [previewImage, setPreviewImage] = useState<string | undefined>(user?.picture_url);
  const { trigger, isMutating } = useSWRMutation(endpoint.uploadPicture, fileUploadFetcher);

  const handleUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const preview = await toBase64(file);
      setPreviewImage(preview);
      await trigger({ file } as { file: File });
      mutate(endpoint.profile);
    },
    [trigger],
  );

  useEffect(() => {
    setPreviewImage(user?.picture_url);
  }, [user?.picture_url]);

  return { previewImage, isMutating, handleUpload };
}

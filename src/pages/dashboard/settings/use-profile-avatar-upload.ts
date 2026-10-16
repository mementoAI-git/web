import { getProfileAvatarUrl } from "@/utility/profile-avatar";
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import useSWRMutation from "swr/mutation";
import { mutate } from "swr";
import endpoint from "@/api/endpoint";
import { fileUploadFetcher } from "@/api/fetcher";
import { useStore } from "@/hooks/use-store";
import { toast } from "sonner";
import { toBase64 } from "@/utility";

export function useProfileAvatarUpload() {
  const { user } = useStore();
  const avatarUrl = getProfileAvatarUrl(user);
  const [previewImage, setPreviewImage] = useState<string | undefined>(
    avatarUrl,
  );
  const busyRef = useRef(false);
  const [isMutating, setBusy] = useState(false);
  const { trigger } = useSWRMutation(endpoint.uploadPicture, fileUploadFetcher);

  const handleUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file || busyRef.current) return;
      if (!file.type.startsWith("image/") || file.size > 15 * 1024 * 1024) {
        toast.error("Choose an image smaller than 15 MB.");
        return;
      }
      busyRef.current = true;
      setBusy(true);
      const previous = previewImage;
      try {
        const preview = await toBase64(file);
        setPreviewImage(preview);
        const result = await trigger({ file });
        if (!result?.success) {
          // The shared transport already reports failures through a toast.
          setPreviewImage(previous);
          return;
        }
        toast.success("Profile photo updated");
        void mutate(endpoint.profile).catch(() => undefined);
      } catch {
        setPreviewImage(previous);
        toast.error("Couldn’t update your profile photo. Please try again.");
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [trigger, previewImage],
  );

  useEffect(() => {
    if (!busyRef.current) setPreviewImage(avatarUrl);
  }, [avatarUrl]);

  return { previewImage, isMutating, handleUpload };
}

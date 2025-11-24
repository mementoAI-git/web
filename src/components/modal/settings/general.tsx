import { type ChangeEvent, useCallback, useEffect, useState } from "react";
import useSWRMutation from "swr/mutation";
import endpoint from "@/api/endpoint";
import { fileUploadFetcher } from "@/api/fetcher";
import Spinner from "@/components/spinner";
import { LogoutIcon } from "@/components/icons";
import { cn, isEmpty, toBase64 } from "@/utility";
import { useStore } from "@/hooks/use-store";
import { useLogout } from "@/hooks/use-logout";
import UpdateTextInput from "./update-text-input";
import avatarPlaceholder from "@/assets/image/avatar.png";
import { mutate } from "swr";
import { useModal } from "@/hooks/use-modal";

export default function General() {
  const { user } = useStore();
  const { close } = useModal();
  const { logout, loading } = useLogout();
  const [previewImage, setPreviewImage] = useState<string | undefined>(user?.picture_url);
  const { trigger, isMutating } = useSWRMutation(endpoint.uploadPicture, fileUploadFetcher);

  const handleUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const preview = await toBase64(file);
      setPreviewImage(preview);
      await trigger({ file } as any);
      mutate(endpoint.profile);
    },
    [trigger],
  );

  const handleLogout = useCallback(async () => {
    await logout();
    close?.("settings");
  }, [logout, close]);

  useEffect(() => {
    setPreviewImage(user?.picture_url);
  }, [user?.picture_url]);

  return (
    <div className="flex w-full flex-col gap-10">
      <div className="flex flex-col gap-2">
        <span className="font-inter text-base font-bold text-gray-950/90">General</span>
        <span className="font-inter text-sm text-gray-950/70">Manage your Memento profile</span>
      </div>
      <div className="flex items-start justify-between gap-6">
        <div className="flex gap-4">
          <div className="relative size-[50px] overflow-hidden rounded-[14px] bg-gray-950/4">
            <img
              alt="Profile"
              width={72}
              height={72}
              src={!isEmpty(previewImage) ? previewImage : avatarPlaceholder}
              className="size-full object-cover"
            />
            {isMutating && (
              <div className="absolute inset-0 flex size-full items-center justify-center bg-black/15">
                <Spinner loading className="!mr-0 !size-6" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-garamond text-2xl font-medium text-gray-950/90">
              {user?.first_name} {user?.last_name}
            </span>
            <span className="font-inter text-sm text-gray-950/70">{user?.email}</span>
            <label
              htmlFor="profile-image"
              className="cursor-pointer rounded-full border border-black/10 px-3 py-2 text-center font-inter text-xs font-medium text-gray-950/90"
            >
              Edit photo
              <input
                id="profile-image"
                type="file"
                accept="image/*"
                hidden
                name="file"
                onChange={handleUpload}
              />
            </label>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className={cn("icon-container", "size-9! rounded-[10px]!")}
        >
          {loading ? <Spinner loading className="size-5! text-blue-6!" /> : <LogoutIcon className="size-5" />}
        </button>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-4">
        <UpdateTextInput label="First name" name="first_name" />
        <UpdateTextInput label="Last name" name="last_name" />
        <UpdateTextInput
          label="Location"
          name="location"
          btnText={user?.location ? "Change" : "Set Location"}
          placeholder="New York, USA"
        />
        <UpdateTextInput
          label="Phone number"
          name="phone_number"
          btnText={isEmpty(user?.phone_number) ? "Add Phone number" : "Change Phone number"}
        />
      </div>
    </div>
  );
}


import { type ChangeEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
export default function General() {
  const { user } = useStore();
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
  }, [logout]);

  useEffect(() => {
    setPreviewImage(user?.picture_url);
  }, [user?.picture_url]);

  return (
    <div className="flex w-full flex-col gap-10">
      {/* type-text-wrap-balance-headings, ux-proximity-grouping */}
      <header className="flex flex-col gap-2">
        <span className="font-inter text-base font-bold text-v3-text-strong text-balance">General</span>
        <span className="font-inter text-sm text-v3-text-weak text-pretty">
          Manage your Memento profile
        </span>
      </header>
      <div className="flex items-start justify-between gap-6">
        <div className="flex min-w-0 gap-4">
          {/* visual-concentric-radius: card 24px → avatar 12px */}
          <div className="relative size-[52px] shrink-0 overflow-hidden rounded-xl bg-v3-fill-weaker ring-1 ring-v3-stroke-weak">
            <img
              alt="Profile"
              width={72}
              height={72}
              src={!isEmpty(previewImage) ? previewImage : avatarPlaceholder}
              className="size-full object-cover"
            />
            {isMutating && (
              <div className="absolute inset-0 flex size-full items-center justify-center bg-v3-fill-strong/20">
                <Spinner loading className="!mr-0 !size-6 text-v3-text-strong" />
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <span className="font-garamond text-2xl font-medium text-v3-text-strong text-balance">
              {user?.first_name} {user?.last_name}
            </span>
            <span className="font-inter text-sm text-v3-text-weak break-all">{user?.email}</span>
            <label
              htmlFor="profile-image"
              className={cn(
                "inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full border border-v3-stroke-weak",
                "px-4 py-2 text-center font-inter text-xs font-medium text-v3-text-strong",
                "motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out",
                "hover:bg-v3-fill-weak active:motion-safe:scale-[0.99]",
                "focus-within:ring-2 focus-within:ring-v3-stroke-strong focus-within:ring-offset-2",
              )}
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
        {/* ux-fitts-target-size: ≥44px hit target */}
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Log out"
          className={cn(
            "icon-container flex size-11 shrink-0 items-center justify-center rounded-xl",
            "border border-v3-stroke-weak text-v3-text-strong",
            "motion-safe:transition-[background-color,transform] motion-safe:duration-200 motion-safe:ease-out",
            "hover:bg-v3-fill-weak active:motion-safe:scale-[0.98]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2",
          )}
        >
          {loading ? <Spinner loading className="size-5! text-v3-brand-strong" /> : <LogoutIcon className="size-5" />}
        </button>
      </div>

      <Link
        to="/onboard/misc"
        className={cn(
          "flex min-h-11 items-center justify-between gap-3 rounded-xl border border-v3-stroke-weak p-4 text-left",
          "font-inter text-sm font-medium text-v3-text-strong",
          "motion-safe:transition-[background-color,transform] motion-safe:duration-200 motion-safe:ease-out",
          "hover:bg-v3-fill-weaker active:motion-safe:scale-[0.995]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2",
        )}
      >
        <span className="text-pretty">Revisit preferences</span>
        <span className="text-v3-text-weaker" aria-hidden>
          →
        </span>
      </Link>
      <div className="flex flex-col gap-4 rounded-xl border border-v3-stroke-weak bg-v3-fill-weaker/50 p-4 sm:p-5">
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


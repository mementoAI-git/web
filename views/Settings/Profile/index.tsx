"use client";

import { Textinput } from "@/components/Form";
import StatsCard from "./StatsCard";
import BoltIcon from "@/public/icon/bolt.svg"
import ChangeImage from "./ChangeImage";
import { useStore } from "@/hooks/use-store";
import UpdateTextinput from "./UpdateTextinput";
import { isEmpty } from "@/utility";

export function Profile() {
  const { user } = useStore()
  return (
    <div>
      <div className="space-y-3">
        <div className="space-y-3">
          <h4 className="text-secondary font-medium font-bricolage text-4xl">My Profile</h4>
          <small className="text-base font-inter text-grey-600">Manage your memento profile</small>
        </div>
        <ChangeImage image={user?.picture_url} />
      </div>

      <div className="py-8 space-y-6">
        <span className="text-[#000933A6] inline-block">Stats</span>
        <div className="flex flex-wrap gap-6">
          <StatsCard icon="✌🏾" value={String(user?.streak || 0)} title="Current streak" />
          <StatsCard
            icon={<BoltIcon width={20} height={22} />}
            value="256"
            title="Points earned"
          />
        </div>
      </div>

      <div className="py-8 flex flex-col gap-6">
        <span className="text-[#000933A6]">Personal info</span>
        <UpdateTextinput label="First name" name="first_name" />
        <UpdateTextinput label="Last name" name="last_name" />
        <Textinput
          label="Email"
          value={user?.email}
          labelClassName="!text-grey-200 !font-normal"
          end={<span className="text-primary font-semibold font-inter text-sm cursor-pointer">Update</span>}
        />
        <Textinput
          label="Location"
          labelClassName="!text-grey-200 !font-normal"
          end={<span className="text-primary font-semibold font-inter text-sm cursor-pointer">Change</span>}
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
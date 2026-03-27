"use client";

import { Searchinput } from "@/components/Form";
import { useModal } from "@/hooks/use-modal";
import { SettingsActionRow, SettingsPillButton } from "../../settings-action-row";

export default function GroupListHeader() {
  const { push } = useModal();

  return (
    <div className="flex w-full flex-col gap-4">
      <SettingsActionRow
        label="Create a group to organize beneficiaries."
        action={
          <SettingsPillButton type="button" variant="default" onClick={() => push?.("add-group")}>
            Add group
          </SettingsPillButton>
        }
      />
      <div className="w-full sm:max-w-[303px]">
        <Searchinput className="!border-v3-stroke-weak !bg-white" />
      </div>
    </div>
  );
}

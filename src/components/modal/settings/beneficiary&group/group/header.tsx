"use client";

import { Searchinput } from "@/components/Form";
import { useModal } from "@/hooks/use-modal";
import { SettingsPillButton } from "../../settings-action-row";

export default function GroupListHeader() {
  const { push } = useModal();

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3">
      <div className="w-full sm:max-w-[260px]">
        <Searchinput className="!border-v3-stroke-weak !bg-v3-fill-weaker/50" />
      </div>
      <SettingsPillButton type="button" variant="default" onClick={() => push?.("add-group")}>
        Add group
      </SettingsPillButton>
    </div>
  );
}

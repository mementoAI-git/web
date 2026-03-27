"use client";

import { useState } from "react";
import useSWR from "swr";
import Table from "@/components/table";
import type { IGroup, IPagination } from "@/utility/interface";
import { groupsListKey, groupsListFetcher } from "@/api/groups";
import GroupHeader from "./header";
import GroupRow from "./row";
import EmptyTableRow from "@/components/table/empty-table-row";
import { SettingsSectionCard } from "../../settings-section-card";

const columns = [
  { label: "group name", className: "w-[22%] max-w-[170px]" },
  { label: "date created", className: "!w-[15%]" },
  { label: "description", className: "!w-[25%]" },
  { label: "members", className: "!w-[18%]" },
  { label: "actions", className: "text-right" },
];

export default function GroupManagement() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSWR<IPagination<IGroup>>(groupsListKey(page), groupsListFetcher, {
    revalidateOnFocus: false,
  });

  const tableData: IPagination<IGroup> | undefined = data;
  const count = tableData?.totalDocs ?? 0;

  return (
    <SettingsSectionCard
      title={
        <span className="inline-flex flex-wrap items-center gap-2">
          Groups
          <span className="rounded-full bg-v3-fill-weaker px-2.5 py-0.5 text-xs font-normal text-v3-text-weak">
            {count} {count === 1 ? "group" : "groups"}
          </span>
        </span>
      }
    >
      <GroupHeader />
      <div className="hide-scrollbar -mx-1 w-full overflow-x-auto border-t border-v3-stroke-weak pt-4 text-xs">
        <Table
          data={tableData}
          columns={columns}
          loading={isLoading}
          headerClassName="!text-xs text-v3-text-weak"
          onChangePage={setPage}
          emptyRow={
            <EmptyTableRow
              colSpan={columns.length}
              title="No groups yet"
              description="Create a group to organize your beneficiaries."
            />
          }
          renderRow={(group, index) => <GroupRow group={group} key={group._id ?? index} />}
        />
      </div>
    </SettingsSectionCard>
  );
}

"use client";

import { useState } from "react";
import useSWR from "swr";
import Table from "@/components/table";
import type { IGroup, IPagination } from "@/utility/interface";
import { groupsListKey, groupsListFetcher } from "@/api/groups";
import GroupHeader from "./header";
import GroupRow from "./row";
import EmptyTableRow from "@/components/table/empty-table-row";

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

  return (
    <div className="flex flex-col gap-4">
      <GroupHeader />
      <div className="hide-scrollbar -mx-1 w-full overflow-x-auto border-t border-v3-stroke-weak pt-3 text-xs">
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
    </div>
  );
}

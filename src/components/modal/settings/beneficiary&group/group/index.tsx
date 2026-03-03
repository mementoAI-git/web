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
  const { data, isLoading } = useSWR<IPagination<IGroup>>(
    groupsListKey(page),
    groupsListFetcher,
    { revalidateOnFocus: false }
  );

  const tableData: IPagination<IGroup> = data;

  return (
    <div className="flex w-full flex-col gap-10">
      <div className="space-y-6">
        <GroupHeader count={tableData?.totalDocs ?? 0} />
        <div className="hide-scrollbar w-full overflow-x-auto text-xs">
          <Table
            data={tableData}
            columns={columns}
            loading={isLoading}
            headerClassName="!text-xs text-gray-500"
            onChangePage={setPage}
            emptyRow={<EmptyTableRow colSpan={columns.length} title="No groups yet" description="Create a group to organize your beneficiaries." />}
            renderRow={(group, index) => (
              <GroupRow group={group} key={group._id ?? index} />
            )}
          />
        </div>
      </div>
    </div>
  );
}

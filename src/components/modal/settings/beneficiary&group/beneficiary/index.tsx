import endpoint from "@/api/endpoint";
import Table from "@/components/table";
import type { IBeneficiary, IPagination } from "@/utility/interface";
import { useState } from "react";
import useSWR from "swr";
import Header from "./header";
import Row from "./row";
import EmptyTableRow from "@/components/table/empty-table-row";

const columns = [
  { label: "recipient", className: "w-[22%] max-w-[170px]" },
  { label: "date added", className: "!w-[15%]" },
  { label: "relationship", className: "!w-[19%]" },
  { label: "groups", className: "!w-[23%]" },
  { label: "actions", className: "text-right" },
];

export interface IBeneficiaryWithGroups extends IBeneficiary {
  groups: { _id: string; name: string; color?: number }[];
}

export default function Beneficiary() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSWR<{ data?: IPagination<IBeneficiaryWithGroups> }>(
    `${endpoint.beneficiaries}?page=${page}`
  );

  const tableData: IPagination<IBeneficiaryWithGroups> | undefined = data?.data;

  return (
    <div className="space-y-6">
      <Header count={tableData?.totalDocs ?? 0} />
      <div className="hide-scrollbar w-full overflow-x-auto text-xs">
        <Table
          data={tableData}
          columns={columns}
          loading={isLoading}
          headerClassName="!text-xs text-gray-500"
          onChangePage={setPage}
          emptyRow={<EmptyTableRow colSpan={columns.length} title="No beneficiaries yet" description="Add a beneficiary to give them access to your Memento." />}
          renderRow={(beneficiary, index) => (
            <Row beneficiary={beneficiary} key={beneficiary._id ?? index} />
          )}
        />
      </div>
    </div>
  );
}
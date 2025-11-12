"use client";

import { useState } from "react";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import Table from "@/components/table";
import type { IBeneficiary, IPagination } from "@/utility/interface";
import Header from "./header";
import Row from "./row";

const columns = [
  { label: "recipient", className: "w-[22%] max-w-[170px]" },
  { label: "date added", className: "!w-[15%]" },
  { label: "relationship", className: "!w-[19%]" },
  { label: "permission level", className: "!w-[23%]" },
  { label: "actions", className: "text-right" },
]

export default function Beneficiary() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSWR<IPagination<IBeneficiary>>(`${endpoint.beneficiaries}?page=${page}`);

  const tableData: IPagination<IBeneficiary> =
    data ?? {
      docs: [],
      hasNextPage: false,
      hasPrevPage: false,
      limit: 0,
      nextPage: null,
      page,
      pagingCounter: 0,
      prevPage: null,
      totalDocs: 0,
      totalPages: 1,
    };

  return (
    <div className="flex w-full flex-col gap-10 py-6">
      <div className="flex flex-col gap-2">
        <span className="font-inter text-base font-bold text-gray-950/90">Beneficiary</span>
        <span className="font-inter text-sm text-gray-950/70">
          Your beneficiaries are allowed access to your Memento
        </span>
      </div>
      <div className="space-y-6">
        <Header count={tableData.totalDocs} />
        <div className="hide-scrollbar w-full overflow-x-auto text-xs">
          <Table
            data={tableData}
            columns={columns}
            loading={isLoading}
            headerClassName="!text-xs text-gray-500"
            onChangePage={setPage}
            renderRow={(beneficiary, index) => (
              <Row beneficiary={beneficiary} key={beneficiary._id ?? index} />
            )}
          />
        </div>
      </div>
    </div>
  );
}
